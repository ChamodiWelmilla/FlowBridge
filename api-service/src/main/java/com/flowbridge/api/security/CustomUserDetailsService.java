package com.flowbridge.api.security;

import com.flowbridge.api.domain.User;
import com.flowbridge.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String enterpriseName) throws UsernameNotFoundException {
        User user = userRepository.findByEnterpriseName(enterpriseName)
                .orElseThrow(() -> new UsernameNotFoundException("Enterprise not found with name: " + enterpriseName));

        return new org.springframework.security.core.userdetails.User(
                user.getEnterpriseName(),
                user.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority(user.getRole()))
        );
    }
}
