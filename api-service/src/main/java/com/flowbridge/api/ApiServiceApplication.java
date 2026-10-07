package com.flowbridge.api;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootApplication
public class ApiServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiServiceApplication.class, args);
    }

    @Bean
    public CommandLineRunner dropLegacyConstraints(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                jdbcTemplate.execute("ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_status_check;");
                jdbcTemplate.execute("ALTER TABLE document_events DROP CONSTRAINT IF EXISTS document_events_new_status_check;");
                jdbcTemplate.execute("ALTER TABLE document_events DROP CONSTRAINT IF EXISTS document_events_previous_status_check;");
                System.out.println("Successfully dropped legacy status check constraints from PostgreSQL.");
            } catch (Exception e) {
                System.err.println("Warning: Could not drop legacy constraints: " + e.getMessage());
            }
        };
    }
}
