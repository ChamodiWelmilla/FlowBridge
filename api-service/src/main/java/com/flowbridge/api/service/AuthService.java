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

        String role = (request.getRole() != null && !request.getRole().isBlank()) 
                ? request.getRole() 
                : "ROLE_USER";

        if (!role.startsWith("ROLE_")) {
            role = "ROLE_" + role;
        }

        User user = User.builder()
                .id("USER-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .username(request.getUsername())
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

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .username(request.getUsername())
                .build();
    }
}
