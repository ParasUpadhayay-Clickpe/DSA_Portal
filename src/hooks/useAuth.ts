import { useState, useCallback } from 'react';
import { authService } from '@/services/authService';
import type {
    LoginCredentials,
    ForgotPasswordRequest,
    AuthResponse,
    OTPResponse,
    ForgotPasswordResponse,
} from '@/types/auth.types';

interface UseAuthReturn {
    // Login with credentials
    loginWithCredentials: (
        credentials: LoginCredentials
    ) => Promise<AuthResponse>;
    isLoggingIn: boolean;

    // Mobile OTP
    requestOTP: (mobile: string) => Promise<OTPResponse>;
    verifyOTP: (mobile: string, otp: string) => Promise<AuthResponse>;
    isRequestingOTP: boolean;
    isVerifyingOTP: boolean;

    // Forgot password
    forgotPassword: (
        request: ForgotPasswordRequest
    ) => Promise<ForgotPasswordResponse>;
    isRequestingReset: boolean;

    // Logout
    logout: () => void;

    // Auth state
    isAuthenticated: boolean;
    currentUser: ReturnType<typeof authService.getCurrentUser>;
}

export const useAuth = (): UseAuthReturn => {
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isRequestingOTP, setIsRequestingOTP] = useState(false);
    const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
    const [isRequestingReset, setIsRequestingReset] = useState(false);

    const loginWithCredentials = useCallback(
        async (credentials: LoginCredentials): Promise<AuthResponse> => {
            setIsLoggingIn(true);
            try {
                const response = await authService.loginWithCredentials(credentials);
                return response;
            } finally {
                setIsLoggingIn(false);
            }
        },
        []
    );

    const requestOTP = useCallback(
        async (mobile: string): Promise<OTPResponse> => {
            setIsRequestingOTP(true);
            try {
                const response = await authService.requestOTP(mobile);
                return response;
            } finally {
                setIsRequestingOTP(false);
            }
        },
        []
    );

    const verifyOTP = useCallback(
        async (mobile: string, otp: string): Promise<AuthResponse> => {
            setIsVerifyingOTP(true);
            try {
                const response = await authService.verifyOTPAndLogin(mobile, otp);
                return response;
            } finally {
                setIsVerifyingOTP(false);
            }
        },
        []
    );

    const forgotPassword = useCallback(
        async (
            request: ForgotPasswordRequest
        ): Promise<ForgotPasswordResponse> => {
            setIsRequestingReset(true);
            try {
                const response = await authService.requestPasswordReset(request);
                return response;
            } finally {
                setIsRequestingReset(false);
            }
        },
        []
    );

    const logout = useCallback(() => {
        authService.logout();
        window.location.reload();
    }, []);

    return {
        loginWithCredentials,
        isLoggingIn,
        requestOTP,
        verifyOTP,
        isRequestingOTP,
        isVerifyingOTP,
        forgotPassword,
        isRequestingReset,
        logout,
        isAuthenticated: authService.isAuthenticated(),
        currentUser: authService.getCurrentUser(),
    };
};
