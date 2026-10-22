package com.insurepro.iam.util;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = StrongPassword.StrongPasswordValidator.class)
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
public @interface StrongPassword {
    String message() default "Password must be at least 12 characters and include uppercase, lowercase, digit, and special character";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};

    class StrongPasswordValidator implements ConstraintValidator<StrongPassword, String> {
        private static final String SPECIAL = "!@#$%^&*()_+-=[]{}|;':\",./<>?";

        @Override
        public boolean isValid(String password, ConstraintValidatorContext ctx) {
            if (password == null || password.length() < 12) return false;
            boolean hasUpper   = password.chars().anyMatch(Character::isUpperCase);
            boolean hasLower   = password.chars().anyMatch(Character::isLowerCase);
            boolean hasDigit   = password.chars().anyMatch(Character::isDigit);
            boolean hasSpecial = password.chars().anyMatch(c -> SPECIAL.indexOf(c) >= 0);
            return hasUpper && hasLower && hasDigit && hasSpecial;
        }
    }
}
