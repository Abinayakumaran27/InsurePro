package com.insurepro.underwriting;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableFeignClients
@EnableScheduling
public class UnderwritingApplication {
    public static void main(String[] args) {
        SpringApplication.run(UnderwritingApplication.class, args);
    }
}