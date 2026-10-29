package vn.edu.thuyetminh.media;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import vn.edu.thuyetminh.common.Hashing;
import vn.edu.thuyetminh.common.config.AppProperties;

/**
 * One-shot, non-destructive media migration. Preflights every referenced local file before uploading
 * anything, verifies SHA-256 on R2, and deliberately never deletes local source files or DB rows.
 */
@Component
@ConditionalOnProperty(prefix = "app.storage.migration", name = "enabled", havingValue = "true")
public class MediaMigrationRunner implements ApplicationRunner {

    private final JdbcTemplate jdbc;
    private final MediaStorage destination;
    private final AppProperties props;
    private final boolean execute;

    public MediaMigrationRunner(JdbcTemplate jdbc, MediaStorage destination, AppProperties props,
                                org.springframework.core.env.Environment environment) {
        this.jdbc = jdbc;
        this.destination = destination;
        this.props = props;
        this.execute = environment.getProperty("app.storage.migration.execute", Boolean.class, false);
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (!(destination instanceof R2MediaStorage)) {
            throw new IllegalStateException("Media migration requires app.storage.provider=r2");
        }
        Path root = Path.of(props.storage().localRoot()).toAbsolutePath().normalize();
        List<MediaRef> refs = jdbc.query("""
                SELECT storage_key, MAX(size_bytes) AS size_bytes, MAX(sha256) AS sha256,
                       MAX(media_type) AS media_type, MAX(ref_id) AS ref_id, MAX(content_type) AS content_type
                  FROM (
                    SELECT id AS ref_id, storage_key, size_bytes, sha256, 'audio' AS media_type, mime_type AS content_type
                      FROM audio_asset
                    UNION ALL
                    SELECT id AS ref_id, storage_key, NULL::bigint AS size_bytes, NULL::varchar AS sha256,
                           'image' AS media_type, mime_type AS content_type
                      FROM poi_image
                    UNION ALL
                    SELECT id AS ref_id, cover_image_key AS storage_key, NULL::bigint AS size_bytes,
                           NULL::varchar AS sha256, 'image' AS media_type, cover_image_type AS content_type
                      FROM poi WHERE cover_image_key IS NOT NULL
                  ) media_refs
                GROUP BY storage_key
                ORDER BY storage_key
                """, (rs, row) -> new MediaRef(rs.getLong("ref_id"), rs.getString("storage_key"),
                rs.getObject("size_bytes", Long.class), rs.getString("sha256"), rs.getString("media_type"),
                rs.getString("content_type")));
        if (refs.isEmpty()) {
            System.out.println("R2 media migration: database has no referenced audio or POI image objects.");
            System.exit(0);
            return;
        }

        List<Source> sources = new ArrayList<>();
        List<String> problems = new ArrayList<>();
        for (MediaRef ref : refs) {
            Path file = safeResolve(root, ref.key());
            if (!Files.isRegularFile(file) && ref.sizeBytes() != null && ref.sha256() != null) {
                file = findByHash(root, ref.sizeBytes(), ref.sha256());
            }
            if (file == null || !Files.isRegularFile(file)) {
                problems.add(ref.mediaType() + " id=" + ref.id() + " " + ref.key() + ": no local source matches the storage key or DB size/SHA-256; DB size=" + ref.sizeBytes() + ", DB SHA-256=" + ref.sha256());
                continue;
            }
            long size = Files.size(file);
            String sha = sha256(file);
            if (ref.sizeBytes() != null && size != ref.sizeBytes()) {
                problems.add(ref.mediaType() + " id=" + ref.id() + " " + ref.key() + ": local size differs from DB metadata");
            }
            if (ref.sha256() != null && !sha.equalsIgnoreCase(ref.sha256())) {
                problems.add(ref.mediaType() + " id=" + ref.id() + " " + ref.key() + ": local SHA-256 differs from DB metadata");
            }
            sources.add(new Source(ref, file, size, sha));
        }
        if (!problems.isEmpty()) {
            System.err.println("R2 media migration preflight failed; no objects were uploaded:");
            problems.forEach(p -> System.err.println(" - " + p));
            throw new IllegalStateException("Fix missing or inconsistent source media before migration");
        }

        if (!execute) {
            System.out.println("R2 media migration DRY RUN passed. Referenced objects: " + sources.size()
                    + ". Source files and database are unchanged. Re-run with app.storage.migration.execute=true to upload.");
            System.exit(0);
            return;
        }

        Map<String, Boolean> remoteObjects = new HashMap<>();
        List<String> remoteProblems = new ArrayList<>();
        for (Source source : sources) {
            String key = source.ref().key();
            boolean exists = destination.exists(key);
            remoteObjects.put(key, exists);
            if (exists) {
                String remoteSha = sha256(destination.get(key).getInputStream());
                if (!source.sha256().equals(remoteSha)) {
                    remoteProblems.add(key + ": existing R2 object SHA-256 differs from source");
                }
            }
        }
        if (!remoteProblems.isEmpty()) {
            remoteProblems.forEach(problem -> System.err.println("R2 preflight: " + problem));
            throw new IllegalStateException("Existing R2 objects failed integrity checks; no uploads were started");
        }

        int uploaded = 0;
        int alreadyPresent = 0;
        for (Source source : sources) {
            String key = source.ref().key();
            if (remoteObjects.get(key)) {
                alreadyPresent++;
                continue;
            }
            try (InputStream input = Files.newInputStream(source.path())) {
                destination.put(key, input, source.size(), source.ref().contentType());
            }
            String remoteSha = sha256(destination.get(key).getInputStream());
            if (!source.sha256().equals(remoteSha)) {
                throw new IllegalStateException("R2 SHA-256 verification failed for key: " + key);
            }
            uploaded++;
        }
        System.out.println("R2 media migration completed. Uploaded and SHA-256 verified: " + uploaded
                + "; already present and verified: " + alreadyPresent
                + "; source files retained; database metadata unchanged.");
        System.exit(0);
    }

    private static Path findByHash(Path root, long expectedSize, String expectedSha) throws IOException {
        if (!Files.isDirectory(root)) return null;
        try (var paths = Files.walk(root)) {
            for (Path candidate : paths.filter(Files::isRegularFile).toList()) {
                if (Files.size(candidate) == expectedSize && sha256(candidate).equalsIgnoreCase(expectedSha)) {
                    return candidate;
                }
            }
        }
        return null;
    }

    private static Path safeResolve(Path root, String key) {
        Path file = root.resolve(key).normalize();
        if (!file.startsWith(root)) throw new IllegalArgumentException("Invalid media storage key");
        return file;
    }

    private static String sha256(Path path) throws IOException {
        try (InputStream input = Files.newInputStream(path)) {
            return sha256(input);
        }
    }

    private static String sha256(InputStream input) throws IOException {
        try (InputStream in = input) {
            MessageDigest digest = Hashing.sha256Digest();
            byte[] buffer = new byte[8192];
            int n;
            while ((n = in.read(buffer)) != -1) digest.update(buffer, 0, n);
            return HexFormat.of().formatHex(digest.digest());
        }
    }

    private record MediaRef(long id, String key, Long sizeBytes, String sha256, String mediaType, String contentType) {}
    private record Source(MediaRef ref, Path path, long size, String sha256) {}
}
