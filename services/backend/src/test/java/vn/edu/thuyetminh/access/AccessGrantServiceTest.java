package vn.edu.thuyetminh.access;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import vn.edu.thuyetminh.common.Hashing;
import vn.edu.thuyetminh.common.error.ApiException;
import vn.edu.thuyetminh.common.error.ErrorCode;

/** UC02 redeem/authenticate rules without Spring or a database. */
class AccessGrantServiceTest {

    private static final Instant NOW = Instant.parse("2026-10-23T08:00:00Z");
    private static final String QR = "qr-token-123";
    private static final String DEVICE = "device-0123456789abcdef";

    private final AccessQrStore qrs = mock(AccessQrStore.class);
    private final AccessGrantStore grants = mock(AccessGrantStore.class);
    private final AccessGrantService service =
            new AccessGrantService(qrs, grants, Clock.fixed(NOW, ZoneOffset.UTC));
    private final AccessPackage demo24h = new AccessPackage("DEMO_24H", "Demo", 1440);

    @Test
    void redeemCreatesAGrantFromThePackageDurationAndStoresOnlyHashes() {
        AccessQr qr = new AccessQr(Hashing.sha256Hex(QR), demo24h, null, 1L, NOW);
        when(qrs.markRedeemed(Hashing.sha256Hex(QR), NOW)).thenReturn(true);
        when(qrs.findByTokenHash(Hashing.sha256Hex(QR))).thenReturn(Optional.of(qr));

        AccessDtos.GrantResponse res = service.redeem(new AccessDtos.RedeemRequest(QR, DEVICE));

        assertThat(res.expiresAt()).isEqualTo(NOW.plus(Duration.ofHours(24)));
        assertThat(res.accessToken()).hasSizeGreaterThanOrEqualTo(43); // 256 random bits, Base64URL
        ArgumentCaptor<AccessGrant> saved = ArgumentCaptor.forClass(AccessGrant.class);
        verify(grants).saveNow(saved.capture());
        assertThat(saved.getValue().getExpiresAt()).isEqualTo(res.expiresAt());
        assertThat(saved.getValue().isBoundTo(Hashing.sha256Hex(DEVICE))).isTrue();
        assertThat(saved.getValue().isBoundTo(DEVICE)).isFalse(); // the raw device id is never stored
    }

    @Test
    void alreadyRedeemedQrIsRejectedAndNoGrantIsCreated() {
        AccessQr used = mock(AccessQr.class);
        when(used.getStatus()).thenReturn(AccessQrStatus.REDEEMED);
        when(qrs.markRedeemed(any(), any())).thenReturn(false);
        when(qrs.findByTokenHash(Hashing.sha256Hex(QR))).thenReturn(Optional.of(used));

        assertThatThrownBy(() -> service.redeem(new AccessDtos.RedeemRequest(QR, DEVICE)))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).getCode()).isEqualTo(ErrorCode.ACCESS_QR_ALREADY_USED);
        verify(grants, never()).saveNow(any());
    }

    @Test
    void unknownAndRevokedQrsGetTheSameGenericError() {
        AccessQr revoked = mock(AccessQr.class);
        when(revoked.getStatus()).thenReturn(AccessQrStatus.REVOKED);
        when(qrs.markRedeemed(any(), any())).thenReturn(false);
        when(qrs.findByTokenHash(Hashing.sha256Hex("revoked"))).thenReturn(Optional.of(revoked));
        when(qrs.findByTokenHash(Hashing.sha256Hex("unknown"))).thenReturn(Optional.empty());

        for (String token : new String[] {"revoked", "unknown"}) {
            assertThatThrownBy(() -> service.redeem(new AccessDtos.RedeemRequest(token, DEVICE)))
                    .extracting(e -> ((ApiException) e).getCode()).isEqualTo(ErrorCode.ACCESS_QR_INVALID);
        }
        verify(grants, never()).saveNow(any());
    }

    @Test
    void authenticateAcceptsOnlyAnActiveGrantOnItsOwnDevice() {
        AccessQr qr = new AccessQr("h", demo24h, null, 1L, NOW);
        AccessGrant active = new AccessGrant(qr, Hashing.sha256Hex("grant"), Hashing.sha256Hex(DEVICE),
                NOW, NOW.plusSeconds(60));
        AccessGrant expired = new AccessGrant(qr, Hashing.sha256Hex("old"), Hashing.sha256Hex(DEVICE),
                NOW.minusSeconds(120), NOW.minusSeconds(1));
        when(grants.findByTokenHash(Hashing.sha256Hex("grant"))).thenReturn(Optional.of(active));
        when(grants.findByTokenHash(Hashing.sha256Hex("old"))).thenReturn(Optional.of(expired));

        assertThat(service.authenticate("grant", DEVICE)).isPresent()
                .get().extracting(AuthenticatedVisitor::packageCode).isEqualTo("DEMO_24H");
        assertThat(service.authenticate("grant", "another-device-0000000")).isEmpty();
        assertThat(service.authenticate("grant", null)).isEmpty();
        assertThat(service.authenticate("old", DEVICE)).isEmpty();

        qr.revoke(NOW);
        assertThat(service.authenticate("grant", DEVICE)).isEmpty();
    }
}
