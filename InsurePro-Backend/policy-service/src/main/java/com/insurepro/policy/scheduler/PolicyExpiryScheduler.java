package com.insurepro.policy.scheduler;

import com.insurepro.policy.client.CustomerServiceClient;
import com.insurepro.policy.client.NotificationServiceClient;
import com.insurepro.policy.entity.Policy;
import com.insurepro.policy.repository.PolicyRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Component
public class PolicyExpiryScheduler {

    private final PolicyRepository policyRepository;

    @Autowired(required = false)
    private CustomerServiceClient customerClient;

    @Autowired(required = false)
    private NotificationServiceClient notifClient;

    public PolicyExpiryScheduler(PolicyRepository policyRepository) {
        this.policyRepository = policyRepository;
    }

    /** Runs daily at 01:00 — marks ACTIVE policies whose end_date has passed as EXPIRED. */
    @Scheduled(cron = "0 0 1 * * *")
    @Transactional
    public void expirePolicies() {
        List<Policy> toExpire = policyRepository
                .findByEndDateBeforeAndStatusAndDeletedFalse(
                        LocalDate.now(), Policy.PolicyStatus.ACTIVE);
        if (toExpire.isEmpty()) {
            log.debug("PolicyExpiryScheduler: no policies to expire");
            return;
        }
        toExpire.forEach(p -> {
            p.setStatus(Policy.PolicyStatus.EXPIRED);
            log.info("PolicyExpiryScheduler: expired policyId={} number={}",
                    p.getPolicyId(), p.getPolicyNumber());
            sendNotification(p.getCustomerId(),
                    "Your policy " + p.getPolicyNumber() + " has expired. Please renew to stay covered.",
                    "POLICY");
        });
        policyRepository.saveAll(toExpire);
        log.info("PolicyExpiryScheduler: expired {} policies", toExpire.size());
    }

    /** Runs daily at 09:00 — sends renewal reminders for policies expiring in 30 days. */
    @Scheduled(cron = "0 0 9 * * *")
    public void sendRenewalNotices() {
        LocalDate targetDate = LocalDate.now().plusDays(30);
        List<Policy> expiringSoon = policyRepository
                .findByEndDateBeforeAndStatusAndDeletedFalse(
                        targetDate.plusDays(1), Policy.PolicyStatus.ACTIVE)
                .stream()
                .filter(p -> !p.getEndDate().isBefore(targetDate))
                .toList();

        if (expiringSoon.isEmpty()) {
            log.debug("PolicyExpiryScheduler: no renewal notices to send");
            return;
        }
        expiringSoon.forEach(p -> {
            log.info("PolicyExpiryScheduler: renewal notice policyId={} number={} expiresOn={}",
                    p.getPolicyId(), p.getPolicyNumber(), p.getEndDate());
            sendNotification(p.getCustomerId(),
                    "Your policy " + p.getPolicyNumber() + " expires on " + p.getEndDate()
                            + ". Renew now to avoid a coverage gap.",
                    "RENEWAL");
        });
        log.info("PolicyExpiryScheduler: sent {} renewal notices", expiringSoon.size());
    }

    private void sendNotification(Long customerId, String message, String category) {
        if (notifClient == null || customerClient == null) return;
        try {
            var wrapper  = customerClient.getCustomerById(customerId);
            var customer = (wrapper != null) ? wrapper.getData() : null;
            if (customer != null && customer.getUserId() != null) {
                notifClient.createNotification(customer.getUserId(), message, category);
            }
        } catch (Exception e) {
            log.warn("PolicyExpiryScheduler: notification failed customerId={}: {}", customerId, e.getMessage());
        }
    }
}
