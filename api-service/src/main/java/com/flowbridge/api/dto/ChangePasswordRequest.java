package com.flowbridge.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChangePasswordRequest {

    @NotBlank(message = "current password is required")
    private String currentPassword;

    @NotBlank(message = "new password is required")
    @Size(min = 6, message = "new password must be at least 6 characters")
    private String newPassword;
}
