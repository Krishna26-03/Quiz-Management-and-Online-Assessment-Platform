package com.quizapp.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quizzes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Quiz {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 1000)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private DifficultyLevel difficulty = DifficultyLevel.MEDIUM;

    // duration of the quiz in minutes - drives the countdown timer on the client
    @Column(nullable = false)
    private Integer durationMinutes;

    // marks awarded per correctly answered question
    @Column(nullable = false)
    @Builder.Default
    private Double marksPerQuestion = 1.0;

    // negative marking per wrong answer (0 disables negative marking)
    @Column(nullable = false)
    @Builder.Default
    private Double negativeMarksPerQuestion = 0.0;

    // minimum % score required to "pass" the quiz
    @Column(nullable = false)
    @Builder.Default
    private Double passPercentage = 40.0;

    // how many times a single student may attempt this quiz (0 = unlimited)
    @Column(nullable = false)
    @Builder.Default
    private Integer maxAttempts = 1;

    // whether questions are shown in a random order to each student
    @Column(nullable = false)
    @Builder.Default
    private boolean shuffleQuestions = true;

    // whether options within a question are shuffled per attempt
    @Column(nullable = false)
    @Builder.Default
    private boolean shuffleOptions = true;

    // quiz lifecycle status: DRAFT, PUBLISHED, or UNPUBLISHED
    // only PUBLISHED quizzes are accessible/visible to students
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private QuizStatus status = QuizStatus.DRAFT;

    // Persisted boolean column to maintain backwards compatibility with existing db schema
    @Column(nullable = false)
    @Builder.Default
    private boolean published = false;

    public boolean isPublished() {
        return this.status == QuizStatus.PUBLISHED;
    }

    public void setStatus(QuizStatus status) {
        this.status = status != null ? status : QuizStatus.DRAFT;
        this.published = (this.status == QuizStatus.PUBLISHED);
    }

    public void setPublished(boolean published) {
        this.published = published;
        this.status = published ? QuizStatus.PUBLISHED : QuizStatus.UNPUBLISHED;
    }

    @PrePersist
    @PreUpdate
    public void syncPublishedAndStatus() {
        if (this.status == null) {
            this.status = this.published ? QuizStatus.PUBLISHED : QuizStatus.DRAFT;
        }
        this.published = (this.status == QuizStatus.PUBLISHED);
    }

    // optional scheduling window during which students may attempt the quiz
    private LocalDateTime startsAt;
    private LocalDateTime endsAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Question> questions = new ArrayList<>();
}
