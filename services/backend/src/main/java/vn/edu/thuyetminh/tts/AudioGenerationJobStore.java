package vn.edu.thuyetminh.tts;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AudioGenerationJobStore {
    Optional<AudioGenerationJob> lockNextDue(Instant now);
    Optional<AudioGenerationJob> findById(Long id);
    Optional<AudioGenerationJob> findActive(Long translationId, String contentHash, Collection<JobStatus> statuses);
    Optional<AudioGenerationJob> findLatestForTranslation(Long translationId);
    List<AudioGenerationJob> findInterrupted(JobStatus status, Instant startedBefore);
    AudioGenerationJob save(AudioGenerationJob job);
}