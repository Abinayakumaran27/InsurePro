package com.insurepro.iam.config;

import com.insurepro.iam.entity.Role;
import com.insurepro.iam.entity.User;
import com.insurepro.iam.repository.RoleRepository;
import com.insurepro.iam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

/**
 * Creates the default SuperAdmin account on first startup.
 * Credentials: username=SuperAdmin, password=SuperAdmin@1234
 * Role: ROLE_ADMIN
 * Idempotent — skipped if the user already exists.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SuperAdminInitializer implements ApplicationRunner {

    private static final String ADMIN_USERNAME = "SuperAdmin";
    private static final String ADMIN_PASSWORD = "SuperAdmin@1234";
    private static final String ADMIN_EMAIL    = "superadmin@insurepro.com";
    private static final String ADMIN_FULLNAME = "Super Admin";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.findByUsernameAndDeletedFalse(ADMIN_USERNAME).isPresent()) {
            log.debug("SuperAdmin already exists — skipping initialization");
            return;
        }

        Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseGet(() -> roleRepository.save(
                        Role.builder()
                                .name("ROLE_ADMIN")
                                .description("System Administrator")
                                .build()));

        Set<Role> roles = new HashSet<>();
        roles.add(adminRole);

        User superAdmin = User.builder()
                .username(ADMIN_USERNAME)
                .email(ADMIN_EMAIL)
                .passwordHash(passwordEncoder.encode(ADMIN_PASSWORD))
                .fullName(ADMIN_FULLNAME)
                .status(User.UserStatus.ACTIVE)
                .createdBy("system")
                .roles(roles)
                .build();

        userRepository.save(superAdmin);
        log.info("SuperAdmin created — username={}, role=ROLE_ADMIN", ADMIN_USERNAME);
    }
}
