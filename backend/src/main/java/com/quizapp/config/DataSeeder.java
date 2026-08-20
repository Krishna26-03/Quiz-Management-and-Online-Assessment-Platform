package com.quizapp.config;

import com.quizapp.entity.ERole;
import com.quizapp.entity.User;
import com.quizapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds a default Admin account on first boot and drops stale enum check constraints
 * so new QuestionTypes (CODE_BASED, IMAGE_BASED, etc.) and QuizStatuses can be stored.
 */
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Value("${app.admin.default-email}")
    private String defaultAdminEmail;

    @Value("${app.admin.default-password}")
    private String defaultAdminPassword;

    @Override
    public void run(String... args) {
        // Drop outdated PostgreSQL check constraints on enum columns so new enum values are accepted
        try {
            jdbcTemplate.execute("ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_type_check");
            jdbcTemplate.execute("ALTER TABLE quizzes DROP CONSTRAINT IF EXISTS quizzes_status_check");
        } catch (Exception e) {
            // Ignore for databases that don't support or have these check constraints
        }

        if (!userRepository.existsByEmail(defaultAdminEmail)) {
            User admin = User.builder()
                    .fullName("Platform Admin")
                    .email(defaultAdminEmail)
                    .password(passwordEncoder.encode(defaultAdminPassword))
                    .role(ERole.ADMIN)
                    .enabled(true)
                    .build();
            userRepository.save(admin);
            System.out.println("======================================================");
            System.out.println(" Default admin account created:");
            System.out.println(" Email:    " + defaultAdminEmail);
            System.out.println(" Password: " + defaultAdminPassword);
            System.out.println(" (change this in production via app.admin.* properties)");
            System.out.println("======================================================");
        }
    }
}
