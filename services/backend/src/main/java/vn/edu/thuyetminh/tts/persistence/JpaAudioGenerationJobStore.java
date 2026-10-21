package vn.edu.thuyetminh.tts.persistence;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import vn.edu.thuyetminh.tts.AudioGenerationJob;
import vn.edu.thuyetminh.tts.AudioGenerationJobRepository;
import vn.edu.thuyetminh.tts.AudioGenerationJobStore;
import vn.edu.thuyetminh.tts.JobStatus;

@Repository
public class JpaAudioGenerationJobStore implements AudioGenerationJobStore {
    private final AudioGenerationJobRepository repository;

    public JpaAudioGenerationJobStore(AudioGenerationJobRepository repository) {
        this.repository = repository;
    }

    @Override public Optional<AudioGenerationJob> lockNextDue(Instant now) {
        return repository.lockNextDue(now);
    }

    @Override public Optional<AudioGenerationJob> findById(Long id) {
        return repository.findById(id);
    }

    @Override public Optional<AudioGenerationJob> findActive(Long translationId, String contentHash,
                                                               Collection<JobStatus> statuses) {
        return repository.findFirstByTranslationIdAndContentHashAndStatusIn(translationId, contentHash, statuses);
    }

    @Override public Optional<AudioGenerationJob> findLatestForTranslation(Long translationId) {
        return repository.findFirstByTranslationIdOrderByIdDesc(translationId);
    }

    @Override public List<AudioGenerationJob> findInterrupted(JobStatus status, Instant startedBefore) {
        return repository.findByStatusAndStartedAtBefore(status, startedBefore);
    }

    @Override public AudioGenerationJob save(AudioGenerationJob job) {
        return repository.save(job);
    }
}