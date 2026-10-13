package vn.edu.thuyetminh.audio;

/**
 * READY  – usable, but only "current" if its contentVersion equals the translation's contentVersion.
 * STALE  – the narration text changed (or a newer audio replaced it); never served to visitors.
 */
public enum AudioAssetStatus {
    READY,
    STALE
}
