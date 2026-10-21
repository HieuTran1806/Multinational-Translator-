package vn.edu.thuyetminh.tts;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface AudioGenerationJobRepository extends JpaRepository<AudioGenerationJob, Long> {

    /** Claims the next due job; SKIP LOCKED lets several workers run safely. */
    @Query(value = """
            select * from audio_generation_job
            where status = 'QUEUED' and next_attempt_at <= :now
            order by id
            limit 1
            for update skip locked
            """, nativeQuery = true)
    Optional<AudioGenerationJob> lockNextDue(Instant now);

    Optional<AudioGenerationJob> findFirstByTranslationIdAndContentHashAndStatusIn(
            Long translationId, String contentHash, Collection<JobStatus> statuses);

    List<AudioGenerationJob> findByStatusAndStartedAtBefore(JobStatus status, Instant before);

    List<AudioGenerationJob> findByStatus(JobStatus status);

    Optional<AudioGenerationJob> findFirstByTranslationIdOrderByIdDesc(Long translationId);
}
