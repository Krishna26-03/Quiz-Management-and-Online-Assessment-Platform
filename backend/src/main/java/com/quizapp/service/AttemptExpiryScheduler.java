package com.quizapp.service;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Advanced feature: periodically closes out any quiz attempt whose countdown timer has
 * expired but that the student never explicitly submitted (e.g. they closed the tab).
 * Ensures scores/leaderboards are always eventually consistent with the timer.
 */
@Component
@RequiredArgsConstructor
public class AttemptExpiryScheduler {

    private final AttemptService attemptService;

    @Scheduled(fixedRate = 60000) // every 60 seconds
    public void closeExpiredAttempts() {
        attemptService.closeExpiredAttempts();
    }
}
