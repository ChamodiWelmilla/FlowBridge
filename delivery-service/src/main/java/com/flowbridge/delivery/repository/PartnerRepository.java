package com.flowbridge.delivery.repository;

import com.flowbridge.delivery.domain.Partner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PartnerRepository extends JpaRepository<Partner, String> {

    Optional<Partner> findByPartnerCode(String partnerCode);
}
