package com.delivery.service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // Disabled for testing
            .authorizeHttpRequests(auth -> auth
                // This is the "Auth Wiring": Only CUSTOMER role can access /api/customers/**
                .requestMatchers("/api/customers/**").hasRole("CUSTOMER")
                .anyRequest().authenticated()
            )
            .formLogin(withDefaults()) 
            .httpBasic(withDefaults());
        return http.build();
    }

    @Bean
    public InMemoryUserDetailsManager userDetailsService() {
        // Creating a test user with the CUSTOMER role
        UserDetails customer = User.withDefaultPasswordEncoder()
            .username("customer1")
            .password("password123")
            .roles("CUSTOMER")
            .build();
        return new InMemoryUserDetailsManager(customer);
    }
}