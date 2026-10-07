package com.flowbridge.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentActionRequest {
    private String action; 
    private String comments;
    private String signerName;
    private String signerRole;
}
