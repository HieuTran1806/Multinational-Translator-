package vn.edu.thuyetminh.access;

import java.security.SecureRandom;
import java.util.Base64;

/** Unguessable opaque tokens: 32 random bytes (256 bits), Base64URL without padding. */
final class AccessTokens {

    private static final SecureRandom RANDOM = new SecureRandom();

    private AccessTokens() {
    }

    static String newToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
