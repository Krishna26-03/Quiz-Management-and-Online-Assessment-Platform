package com.quizapp.controller;

import com.quizapp.dto.LeaderboardDtos.LeaderboardEntry;
import com.quizapp.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    @GetMapping("/quiz/{quizId}")
    public ResponseEntity<List<LeaderboardEntry>> quizLeaderboard(@PathVariable Long quizId) {
        return ResponseEntity.ok(leaderboardService.getQuizLeaderboard(quizId));
    }

    @GetMapping("/global")
    public ResponseEntity<List<LeaderboardEntry>> globalLeaderboard(
            @RequestParam(defaultValue = "OVERALL") LeaderboardService.Scope scope,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "HIGHEST_SCORE") LeaderboardService.Metric metric) {
        return ResponseEntity.ok(leaderboardService.getLeaderboard(scope, categoryId, metric));
    }
}
