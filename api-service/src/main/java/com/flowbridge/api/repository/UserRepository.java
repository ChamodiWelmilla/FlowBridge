package com.flowbridge.api.repository;

import com.flowbridge.api.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByEnterpriseName(String enterpriseName);

    boolean existsByEmail(String email);

    boolean existsByEnterpriseName(String enterpriseName);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT u.enterpriseName FROM User u ORDER BY u.enterpriseName ASC")
    java.util.List<String> findAllEnterpriseNames();
}
