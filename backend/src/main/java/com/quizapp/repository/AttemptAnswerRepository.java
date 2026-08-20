package com.quizapp.repository;

import com.quizapp.entity.AttemptAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AttemptAnswerRepository extends JpaRepository<AttemptAnswer, Long> {
    List<AttemptAnswer> findByQuestionId(Long questionId);
    List<AttemptAnswer> findByAttemptId(Long attemptId);
}
