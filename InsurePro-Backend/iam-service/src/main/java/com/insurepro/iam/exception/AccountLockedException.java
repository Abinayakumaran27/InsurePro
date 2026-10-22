package com.insurepro.iam.exception;
public class AccountLockedException extends RuntimeException {
    private static final long serialVersionUID = 1L;
    public AccountLockedException(String msg) { super(msg); }
}
