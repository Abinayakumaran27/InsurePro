package com.insurepro.policy.util;

import com.insurepro.policy.repository.PolicyRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.concurrent.atomic.AtomicLong;

@Component
@Slf4j
public class PolicyNumberGenerator {

    private final PolicyRepository policyRepository;
    private final AtomicLong counter;

    public PolicyNumberGenerator(PolicyRepository policyRepository) {
        this.policyRepository = policyRepository;
        // Initialize counter from DB to avoid duplicates after restart
        long count = policyRepository.count();
        this.counter = new AtomicLong(count);
        log.info("PolicyNumberGenerator initialized with counter: {}", count);
    }

    public String generate(String policyTypeName) {
        String prefix = policyTypeName != null
                ? policyTypeName.substring(
                        0, Math.min(3, policyTypeName.length()))
                        .toUpperCase()
                : "POL";
        int year = LocalDate.now().getYear();
        String policyNumber;
        do {
            policyNumber = String.format("POL-%s-%d-%07d",
                    prefix, year, counter.incrementAndGet());
        } while (policyRepository
                .findByPolicyNumberAndDeletedFalse(policyNumber)
                .isPresent());
        return policyNumber;
    }
}