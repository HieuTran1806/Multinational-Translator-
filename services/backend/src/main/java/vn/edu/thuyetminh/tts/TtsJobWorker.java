package vn.edu.thuyetminh.tts;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import vn.edu.thuyetminh.common.config.AppProperties;

/** Polls the job table. Disabled in tests (app.tts.worker-enabled=false) where jobs are run explicitly. */
@Component
public class TtsJobWorker {

    private static final Logger log = LoggerFactory.getLogger(TtsJobWorker.class);
    private static final int MAX_JOBS_PER_TICK = 5;

    private final TtsJobService service;
    private final AppProperties props;

    public TtsJobWorker(TtsJobService service, AppProperties props) {
        this.service = service;
        this.props = props;
    }

    /** Startup adapter: recover jobs interrupted by a previous process. */
    @EventListener(ApplicationReadyEvent.class)
    public void recoverOnStartup() {
        service.recoverOnStartup();
    }

    @Scheduled(fixedDelayString = "PT2S", initialDelayString = "PT10S")
    public void tick() {
        if (!props.tts().workerEnabled()) {
            return;
        }
        try {
            for (int i = 0; i < MAX_JOBS_PER_TICK && service.processNextDueJob(); i++) {
                // keep processing due jobs
            }
        } catch (RuntimeException e) {
            log.error("TTS worker tick failed", e);
        }
    }

    @Scheduled(fixedDelayString = "PT5M", initialDelayString = "PT5M")
    public void recoverStale() {
        if (props.tts().workerEnabled()) {
            service.recoverStaleRunning();
        }
    }
}
