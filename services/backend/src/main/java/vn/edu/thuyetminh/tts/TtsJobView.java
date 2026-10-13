package vn.edu.thuyetminh.tts;

import java.time.Instant;

import vn.edu.thuyetminh.audio.AudioView;

/**
 * TTS job state for the admin UI (polling).
 *
 * @param reusedExisting true when no new job was created because current audio already matches
 *                       the same text + language + voice
 */
public record TtsJobView(Long id, JobStatus status, String languageCode, int contentVersion, int attempts,
                         int maxAttempts, String errorCode, String errorMessage, AudioView audio,
                         boolean reusedExisting, Instant createdAt, Instant finishedAt) {
}
