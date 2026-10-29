# Cloudflare R2 media storage

The backend's `MediaStorage` implementation can use either local files (default for development) or Cloudflare R2. Keep Neon as the metadata store; audio and image bytes remain in object storage.

## Environment

Set these variables in the backend runtime only. Never place R2 credentials in frontend variables or commit them:

- `APP_STORAGE_PROVIDER=r2`
- `R2_ENDPOINT` — the account's S3-compatible endpoint
- `R2_BUCKET`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_REGION=auto`

The local Admin backend and Render backend must use the same bucket and credentials with only the permissions needed to read, write, and delete media objects.

## One-time migration

The script reads `.env.local` from the repository root. It disables Flyway and makes no database writes. It checks every `audio_asset`, `poi_image`, and non-null POI cover-image reference.

1. Dry-run first:

   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/migrate-media-to-r2.ps1
   ```

2. If preflight passes, upload and verify:

   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/migrate-media-to-r2.ps1 -Execute
   ```

The migration preserves existing storage keys. It resolves a missing local filename only when a candidate matches the exact size and SHA-256 recorded for that audio asset. Images without a stored hash must exist at their expected local storage key. The script preflights all local sources and any existing R2 objects before starting uploads, verifies SHA-256 by reading each uploaded object back, and never deletes source files or updates database rows. Re-running is safe: matching objects are skipped; mismatches stop the run.

## After migration

1. Set `APP_STORAGE_PROVIDER=r2` in local `.env.local` and in Render's backend environment.
2. Deploy the backend after tests pass.
3. Test Admin upload, User audio playback, POI cover images, MIME type, and byte-range seeking.
4. Keep local source files until the deployed User Web has been verified.

No database schema migration is required.
