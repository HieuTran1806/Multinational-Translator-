package vn.edu.thuyetminh.audio;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface AudioAssetRepository extends JpaRepository<AudioAsset, Long> {

    /** Current audio = READY and produced for the translation's current content version (newest first). */
    Optional<AudioAsset> findFirstByTranslationIdAndContentVersionAndStatusOrderByIdDesc(
            Long translationId, int contentVersion, AudioAssetStatus status);

    List<AudioAsset> findTop10ByTranslationIdOrderByIdDesc(Long translationId);

    List<AudioAsset> findByTranslationIdInAndStatus(Collection<Long> translationIds, AudioAssetStatus status);

    Optional<AudioAsset> findFirstByTranslationIdAndContentHashAndStatusOrderByIdDesc(
            Long translationId, String contentHash, AudioAssetStatus status);

    /** Marks every READY asset of a translation as STALE except the given one (null = all). */
    @Modifying(flushAutomatically = true)
    @Query("""
            update AudioAsset a set a.status = vn.edu.thuyetminh.audio.AudioAssetStatus.STALE
            where a.translationId = :translationId
              and a.status = vn.edu.thuyetminh.audio.AudioAssetStatus.READY
              and (:keepId is null or a.id <> :keepId)
            """)
    int markOthersStale(Long translationId, Long keepId);
}
