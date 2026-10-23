package vn.edu.thuyetminh.audio.persistence;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import vn.edu.thuyetminh.audio.AudioAsset;
import vn.edu.thuyetminh.audio.AudioAssetRepository;
import vn.edu.thuyetminh.audio.AudioAssetStatus;
import vn.edu.thuyetminh.audio.AudioAssetStore;

@Repository
public class JpaAudioAssetStore implements AudioAssetStore {
    private final AudioAssetRepository repository;

    public JpaAudioAssetStore(AudioAssetRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<AudioAsset> findCurrent(Long translationId, int contentVersion) {
        return repository.findFirstByTranslationIdAndContentVersionAndStatusOrderByIdDesc(
                translationId, contentVersion, AudioAssetStatus.READY);
    }

    @Override
    public List<AudioAsset> findLatest(Long translationId) {
        return repository.findTop10ByTranslationIdOrderByIdDesc(translationId);
    }

    @Override
    public List<AudioAsset> findReadyForTranslations(Collection<Long> translationIds) {
        return repository.findByTranslationIdInAndStatus(translationIds, AudioAssetStatus.READY);
    }

    @Override
    public Optional<AudioAsset> findReadyByContentHash(Long translationId, String contentHash) {
        return repository.findFirstByTranslationIdAndContentHashAndStatusOrderByIdDesc(
                translationId, contentHash, AudioAssetStatus.READY);
    }

    @Override
    public Optional<AudioAsset> findById(Long id) {
        return repository.findById(id);
    }

    @Override
    public AudioAsset save(AudioAsset asset) {
        return repository.save(asset);
    }

    @Override
    public int markOthersStale(Long translationId, Long keepId) {
        return repository.markOthersStale(translationId, keepId);
    }
}