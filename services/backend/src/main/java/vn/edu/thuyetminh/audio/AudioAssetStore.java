package vn.edu.thuyetminh.audio;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AudioAssetStore {
    Optional<AudioAsset> findCurrent(Long translationId, int contentVersion);
    List<AudioAsset> findLatest(Long translationId);
    List<AudioAsset> findReadyForTranslations(Collection<Long> translationIds);
    Optional<AudioAsset> findReadyByContentHash(Long translationId, String contentHash);
    Optional<AudioAsset> findById(Long id);
    AudioAsset save(AudioAsset asset);
    int markOthersStale(Long translationId, Long keepId);
}