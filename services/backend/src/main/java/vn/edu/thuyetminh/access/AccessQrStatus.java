package vn.edu.thuyetminh.access;

/** ISSUED → REDEEMED (once) or ISSUED/REDEEMED → REVOKED. A QR never expires before it is redeemed. */
public enum AccessQrStatus {
    ISSUED,
    REDEEMED,
    REVOKED
}
