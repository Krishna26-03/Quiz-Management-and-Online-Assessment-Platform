package com.quizapp.repository;

import com.quizapp.entity.AttemptStatus;
import com.quizapp.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

    List<QuizAttempt> findByUserIdOrderByStartedAtDesc(Long userId);

    List<QuizAttempt> findByQuizIdOrderByStartedAtDesc(Long quizId);

    long countByQuizIdAndUserId(Long quizId, Long userId);

    // Counts finished or expired attempts against maxAttempts
    @Query("select count(a) from QuizAttempt a where a.quiz.id = :quizId and a.user.id = :userId " +
           "and (a.status in (com.quizapp.entity.AttemptStatus.SUBMITTED, com.quizapp.entity.AttemptStatus.AUTO_SUBMITTED) or (a.status = com.quizapp.entity.AttemptStatus.IN_PROGRESS and a.deadlineAt < CURRENT_TIMESTAMP))")
    long countCompletedByQuizIdAndUserId(@Param("quizId") Long quizId, @Param("userId") Long userId);

    Optional<QuizAttempt> findByIdAndUserId(Long id, Long userId);

    List<QuizAttempt> findByStatus(AttemptStatus status);

    @Query("select a from QuizAttempt a where a.quiz.id = :quizId and a.status in ('SUBMITTED','AUTO_SUBMITTED') order by a.totalScore desc, a.submittedAt asc")
    List<QuizAttempt> findLeaderboardForQuiz(@Param("quizId") Long quizId);

    @Query("select count(a) from QuizAttempt a where a.quiz.id = :quizId and a.status in ('SUBMITTED','AUTO_SUBMITTED')")
    long countCompletedAttemptsByQuizId(@Param("quizId") Long quizId);

    @Query("select a from QuizAttempt a where a.status in ('SUBMITTED','AUTO_SUBMITTED') order by a.totalScore desc")
    List<QuizAttempt> findGlobalLeaderboard();
}
