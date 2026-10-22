package com.insurepro.payment.service;
import com.insurepro.payment.dto.request.RecordPaymentRequest;
import com.insurepro.payment.dto.response.PaymentResponse;
import org.springframework.data.domain.Page; import org.springframework.data.domain.Pageable;
public interface PaymentService {
    PaymentResponse recordPayment(RecordPaymentRequest req);
    PaymentResponse getPaymentById(Long paymentId);
    Page<PaymentResponse> getCustomerPayments(Long customerId, Pageable pageable);
    PaymentResponse refundPayment(Long paymentId, Long actorId);
}
