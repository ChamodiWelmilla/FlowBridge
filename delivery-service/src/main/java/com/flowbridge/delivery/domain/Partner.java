package com.flowbridge.delivery.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "partners")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Partner {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "partner_code", nullable = false, unique = true, length = 100)
    private String partnerCode;

    @Column(nullable = false)
    private String name;

    @Column(name = "adapter_type", nullable = false, length = 50)
    private String adapterType;

    @Column(name = "endpoint_url", nullable = false)
    private String endpointUrl;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;
}
