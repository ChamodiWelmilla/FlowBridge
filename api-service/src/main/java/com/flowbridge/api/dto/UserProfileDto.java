package com.flowbridge.api.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileDto {
    private String id;
    private String email;
    private String enterpriseName;
    private String role;
}
