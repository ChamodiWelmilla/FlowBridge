package com.flowbridge.api.service;

import com.flowbridge.api.domain.User;
import com.flowbridge.api.dto.AuthRequest;
import com.flowbridge.api.dto.AuthResponse;
import com.flowbridge.api.dto.RegisterRequest;
import com.flowbridge.api.repository.UserRepository;
import com.flowbridge.api.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import com.flowbridge.api.dto.ChangePasswordRequest;
import com.flowbridge.api.dto.UserProfileDto;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    @Transactional
    public String register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }
        if (userRepository.existsByEnterpriseName(request.getEnterpriseName())) {
            throw new IllegalArgumentException("Enterprise Name is already registered by another account");
        }

        String role = (request.getRole() != null && !request.getRole().isBlank()) 
                ? request.getRole() 
                : "ROLE_USER";

        if (!role.startsWith("ROLE_")) {
            role = "ROLE_" + role;
        }

        User user = User.builder()
                .id("USER-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .username(request.getUsername())
                .email(request.getEmail())
                .enterpriseName(request.getEnterpriseName())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .build();

        userRepository.save(user);
        return "User registered successfully";
    }

    public AuthResponse login(AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .username(user.getUsername())
                .email(user.getEmail())
                .enterpriseName(user.getEnterpriseName())
                .build();
    }

    public UserProfileDto getProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return UserProfileDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .enterpriseName(user.getEnterpriseName())
                .role(user.getRole())
                .build();
    }

    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
