package vn.edu.thuyetminh.common;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/** SHA-256 helpers built on the JDK's MessageDigest (no custom crypto). */
public final class Hashing {

    private Hashing() {
    }

    public static MessageDigest sha256Digest() {
        try {
            return MessageDigest.getInstance("SHA-256");
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    public static String sha256Hex(byte[] data) {
        return HexFormat.of().formatHex(sha256Digest().digest(data));
    }

    public static String sha256Hex(String text) {
        return sha256Hex(text.getBytes(StandardCharsets.UTF_8));
    }

    public static String sha256Hex(InputStream in) throws IOException {
        MessageDigest md = sha256Digest();
        byte[] buf = new byte[8192];
        int n;
        while ((n = in.read(buf)) > 0) {
            md.update(buf, 0, n);
        }
        return HexFormat.of().formatHex(md.digest());
    }
}
