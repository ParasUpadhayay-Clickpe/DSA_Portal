/**
 * Auth Service - Business logic layer
 * Orchestrates API calls and transforms data
 */

import { authApi } from '@/api';
import { clearAllCookies } from '@/utils/cookies';
import type {
    LoginCredentials,
    ForgotPasswordRequest,
    AuthResponse,
    OTPResponse,
    ForgotPasswordResponse,
} from '@/types/auth.types';

export class AuthService {
    /**
     * Login with username and password
     */
    async loginWithCredentials(
        credentials: LoginCredentials
    ): Promise<AuthResponse> {
        try {
            const response = await authApi.login(credentials);

            if (response.success && response.data?.token) {
                // Store token in localStorage (in real app, use secure storage)
                localStorage.setItem('auth_token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }

            return response;
        } catch (error) {
            return {
                success: false,
                message: 'Login failed. Please try again.',
            };
        }
    }

    /**
     * Request OTP for mobile login
     */
    async requestOTP(mobile: string): Promise<OTPResponse> {
        try {
            const response = await authApi.requestMobileOTP(mobile);
            return response;
        } catch (error) {
            return {
                success: false,
                message: 'Failed to send OTP. Please try again.',
            };
        }
    }

    /**
     * Verify OTP and complete login
     */
    async verifyOTPAndLogin(mobile: string, otp: string): Promise<AuthResponse> {
        try {
            const response = await authApi.verifyOTP(mobile, otp);
            return response;
        } catch (error) {
            return {
                success: false,
                message: 'OTP verification failed. Please try again.',
            };
        }
    }

    /**
     * Request password reset
     */
    async requestPasswordReset(
        request: ForgotPasswordRequest
    ): Promise<ForgotPasswordResponse> {
        try {
            return await authApi.forgotPassword(request);
        } catch (error) {
            return {
                success: false,
                message: 'Failed to send reset link. Please try again.',
            };
        }
    }

    /**
     * Logout user
     * Clears all authentication-related localStorage keys and cookies (matching auth_api.md)
     * Note: Table configurations (table_config_*) are preserved across logout
     */
    logout(): void {
        // Save table configurations before clearing (they use keys starting with 'table_config_')
        const tableConfigs: Record<string, string> = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('table_config_')) {
                tableConfigs[key] = localStorage.getItem(key) || '';
            }
        }

        // Clear encrypted tokens
        localStorage.removeItem('auth_token');

        // Clear decrypted agent tokens
        localStorage.removeItem('accessTokenAgent');
        localStorage.removeItem('refreshTokenAgent');
        localStorage.removeItem('headerSecretKeyAgent');
        localStorage.removeItem('bodySecretKeyAgent');

        // Clear agent IDs
        localStorage.removeItem('agent_id');
        localStorage.removeItem('agentId');

        // Clear token dates
        localStorage.removeItem('tokenDateAgent');

        // Clear user data
        localStorage.removeItem('user');

        // Clear OTP session data
        localStorage.removeItem('otp_session');
        localStorage.removeItem('otp_unique_id');
        localStorage.removeItem('otp_reference_id');
        localStorage.removeItem('otp_mobile');

        // Clear role-related data
        localStorage.removeItem('selected_role_id');
        localStorage.removeItem('selected_role_type');

        // Restore table configurations
        Object.entries(tableConfigs).forEach(([key, value]) => {
            localStorage.setItem(key, value);
        });

        // Clear all cookies
        clearAllCookies();
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        // Check for either decrypted access token or encrypted auth token
        return !!(
            localStorage.getItem('accessTokenAgent') ||
            localStorage.getItem('auth_token')
        );
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }
}

export const authService = new AuthService();
