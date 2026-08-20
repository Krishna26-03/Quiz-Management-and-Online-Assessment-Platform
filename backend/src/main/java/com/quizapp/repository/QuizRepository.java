package com.quizapp.repository;

import com.quizapp.entity.Quiz;
import com.quizapp.entity.QuizStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findByStatus(QuizStatus status);
    List<Quiz> findByCreatedById(Long userId);
    List<Quiz> findByCategoryId(Long categoryId);

    default List<Quiz> findByPublishedTrue() {
        return findByStatus(QuizStatus.PUBLISHED);
    }
}
