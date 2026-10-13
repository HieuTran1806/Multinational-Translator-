package vn.edu.thuyetminh.audio;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.util.Collection;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import vn.edu.thuyetminh.common.Hashing;
import vn.edu.thuyetminh.common.config.AppProperties;
import vn.edu.thuyetminh.common.error.ApiException;
import vn.edu.thuyetminh.common.error.ErrorCode;
import vn.edu.thuyetminh.media.DetectedMedia;
import vn.edu.thuyetminh.media.MediaStorage;
import vn.edu.thuyetminh.poi.PoiTranslation;

/** Stores audio bytes in {@link MediaStorage} and metadata in {@code audio_asset}. */
@Service
public class AudioService {

    private static final Logger log = LoggerFactory.getLogger(AudioService.class);

    private final AudioAssetRepository assets;
    private final MediaStorage storage;
    private final AppProperties props;

    public AudioService(AudioAssetRepository assets, MediaStorage storage, AppProperties props) {
        this.assets = assets;
        this.storage = storage;
        this.props = props;
    }

    /** The only audio that may be played for this translation, if any. */
    @Transactional(readOnly = true)
    public Optional<AudioAsset> currentAudio(PoiTranslation t) {
        return assets.findFirstByTranslationIdAndContentVersionAndStatusOrderByIdDesc(
                t.getId(), t.getContentVersion(), AudioAssetStatus.READY);
    }

    /** translationId -> current audio, for list views. */
    @Transactional(readOnly = true)
    public Map<Long, AudioAsset> currentAudioByTranslation(Collection<PoiTranslation> translations) {
        if (translations.isEmpty()) {
            return Map.of();
        }
        Map<Long, Integer> versions = translations.stream()
                .collect(Collectors.toMap(PoiTranslation::getId, PoiTranslation::getContentVersion));
        return assets.findByTranslationIdInAndStatus(versions.keySet(), AudioAssetStatus.READY).stream()
                .filter(a -> versions.get(a.getTranslationId()) == a.getContentVersion())
                .collect(Collectors.toMap(AudioAsset::getTranslationId, Function.identity(),
                        (a, b) -> a.getId() > b.getId() ? a : b));
    }

    @Transactional(readOnly = true)
    public List<AudioAsset> history(Long translationId) {
        return assets.findTop10ByTranslationIdOrderByIdDesc(translationId);
    }

    @Transactional
    public void invalidateForTranslation(Long translationId) {
        int n = assets.markOthersStale(translationId, null);
        if (n > 0) {
            log.info("Translation {} narration changed: {} audio asset(s) marked STALE", translationId, n);
        }
    }

    /** Validates and stores an uploaded file for the translation's current content version. */
    @Transactional
    public AudioAsset storeUpload(PoiTranslation t, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(ErrorCode.BAD_REQUEST, "Vui lòng chọn file audio");
        }
        if (file.getSize() > props.upload().maxAudioBytes()) {
            throw new ApiException(ErrorCode.PAYLOAD_TOO_LARGE, "File audio vượt quá "
                    + (props.upload().maxAudioBytes() / (1024 * 1024)) + " MB");
        }
        DetectedMedia type;
        try (InputStream in = file.getInputStream()) {
            type = DetectedMedia.detect(in.readNBytes(12));
        } catch (IOException e) {
            throw new ApiException(ErrorCode.BAD_REQUEST, "Không đọc được file tải lên");
        }
        if (type == null || !type.isAudio()) {
            throw new ApiException(ErrorCode.UNSUPPORTED_MEDIA, "Chỉ chấp nhận audio MP3, M4A, WAV hoặc OGG");
        }
        String key = newKey(type);
        String sha;
        try (InputStream in = file.getInputStream()) {
            MessageDigest md = Hashing.sha256Digest();
            storage.put(key, new DigestInputStream(in, md), file.getSize(), type.mimeType());
            sha = HexFormat.of().formatHex(md.digest());
        } catch (IOException e) {
            log.error("Failed to store uploaded audio", e);
            throw new ApiException(ErrorCode.INTERNAL_ERROR, "Không lưu được file audio");
        }
        AudioAsset asset = assets.save(new AudioAsset(t.getId(), t.getContentVersion(), key, AudioSource.UPLOAD,
                type.extension(), type.mimeType(), file.getSize(), sha, null, null,
                safeFilename(file.getOriginalFilename())));
        assets.markOthersStale(t.getId(), asset.getId());
        return asset;
    }

    /** Stores an in-memory audio file as an upload (used for bundled dev demo fixtures). */
    @Transactional
    public AudioAsset storeUploadBytes(PoiTranslation t, byte[] audio, String filename) {
        DetectedMedia type = DetectedMedia.detect(audio);
        if (type == null || !type.isAudio()) {
            throw new ApiException(ErrorCode.UNSUPPORTED_MEDIA, "Chỉ chấp nhận audio MP3, M4A, WAV hoặc OGG");
        }
        String key = newKey(type);
        try {
            storage.put(key, new ByteArrayInputStream(audio), audio.length, type.mimeType());
        } catch (IOException e) {
            throw new IllegalStateException("Could not store audio", e);
        }
        AudioAsset asset = assets.save(new AudioAsset(t.getId(), t.getContentVersion(), key, AudioSource.UPLOAD,
                type.extension(), type.mimeType(), audio.length, Hashing.sha256Hex(audio), null, null,
                safeFilename(filename)));
        assets.markOthersStale(t.getId(), asset.getId());
        return asset;
    }

    /** Stores audio bytes produced by a TTS provider. */
    @Transactional
    public AudioAsset storeTts(PoiTranslation t, int contentVersion, byte[] audio, String contentHash, String voice) {
        DetectedMedia type = DetectedMedia.detect(audio);
        if (type == null || !type.isAudio()) {
            throw new IllegalStateException("TTS provider returned unsupported audio");
        }
        String key = newKey(type);
        try {
            storage.put(key, new ByteArrayInputStream(audio), audio.length, type.mimeType());
        } catch (IOException e) {
            throw new IllegalStateException("Could not store TTS audio", e);
        }
        AudioAsset asset = assets.save(new AudioAsset(t.getId(), contentVersion, key, AudioSource.TTS,
                type.extension(), type.mimeType(), audio.length, Hashing.sha256Hex(audio), contentHash, voice,
                null));
        assets.markOthersStale(t.getId(), asset.getId());
        return asset;
    }

    public Optional<AudioAsset> findReadyByContentHash(Long translationId, String contentHash) {
        return assets.findFirstByTranslationIdAndContentHashAndStatusOrderByIdDesc(
                translationId, contentHash, AudioAssetStatus.READY);
    }

    public Optional<AudioAsset> findById(Long id) {
        return assets.findById(id);
    }

    private static String newKey(DetectedMedia type) {
        return "audio/" + UUID.randomUUID() + "." + type.extension();
    }

    static String safeFilename(String name) {
        if (name == null) {
            return null;
        }
        String base = name.replace('\\', '/');
        base = base.substring(base.lastIndexOf('/') + 1);
        base = base.replaceAll("[^\\p{L}\\p{N}._ -]", "_");
        return base.length() > 200 ? base.substring(0, 200) : base;
    }
}
