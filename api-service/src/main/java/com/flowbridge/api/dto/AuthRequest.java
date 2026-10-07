package com.flowbridge.api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthRequest {

    @NotBlank(message = "enterpriseName is required")
    private String enterpriseName;

    @NotBlank(message = "password is required")
    private String password;
}
