/**
 * Auth API class following SOLID principles
 * Single Responsibility: Handles authentication-related API calls only
 * Interface Segregation: Only exposes auth-related methods
 * Dependency Inversion: Depends on BaseApi abstraction
 */

import { BaseApi } from './base.api';
import { NOTIFICATION_API_BASE_URL, API_ENDPOINTS, APP_CONFIG } from '@/config';
import { v4 as uuidv4 } from 'uuid';
import { decryptAuthKey } from '@/utils/crypto';
import type {
    LoginCredentials,
    MobileOTPRequest,
    VerifyOTPRequest,
    AuthResponse,
    OTPResponse,
    GenerateOTPResponse,
    VerifyOTPResponse,
    AgentEmailLoginRequest,
    AgentEmailLoginResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    SendEmailNotificationRequest,
    SendEmailNotificationResponse,
} from '@/types/auth.types';

export class AuthApi extends BaseApi {
    constructor() {
        super(NOTIFICATION_API_BASE_URL);
    }

    /**
     * Agent Email/Password Login
     * Endpoint: POST /agent_email_login
     */
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        try {
            const requestData: AgentEmailLoginRequest = {
                identifier: credentials.identifier,
                password: credentials.password,
            };

            const response = await this.post<AgentEmailLoginResponse>(
                '/agent_email_login',
                requestData
            );

            if (response.success && response.data) {
                const loginData = response.data;

                if (loginData.status === 'success') {
                    // Decrypt the auth key and store tokens
                    let accessToken = '';
                    let refreshToken = '';
                    if (APP_CONFIG.DECRYPTION_KEY && loginData.key) {
                        try {
                            [accessToken, refreshToken] = decryptAuthKey(
                                loginData.key,
                                APP_CONFIG.DECRYPTION_KEY,
                                true // isAgent = true
                            );
                        } catch (error) {
                            console.error('Failed to decrypt auth key:', error);
                            console.error(
                                'DECRYPTION_KEY is set but decryption failed. ' +
                                'Please verify that REACT_APP_ENCRYPTION_DEV or REACT_APP_ENCRYPTION_PROD is correct.'
                            );
                            // Store encrypted key as fallback, but this should not be used for API calls
                            localStorage.setItem('auth_token', loginData.key);
                        }
                    } else {
                        console.warn(
                            'DECRYPTION_KEY is not set. ' +
                            'Please set REACT_APP_ENCRYPTION_DEV or REACT_APP_ENCRYPTION_PROD environment variable. ' +
                            'Storing encrypted key as fallback (not recommended for production).'
                        );
                        // Store encrypted key as fallback, but this should not be used for API calls
                        localStorage.setItem('auth_token', loginData.key);
                    }

                    // Store agent ID and user data
                    localStorage.setItem('agent_id', loginData.agent_id);
                    localStorage.setItem('agentId', loginData.agent_id);
                    localStorage.setItem('tokenDateAgent', new Date().toISOString());
                    localStorage.setItem(
                        'user',
                        JSON.stringify({
                            id: loginData.agent_id,
                            email: credentials.identifier,
                        })
                    );

                    // Dispatch custom event to notify RoleContext to reload roles
                    window.dispatchEvent(new CustomEvent('agentLoggedIn'));

                    return {
                        success: true,
                        message: loginData.message || 'Login successful',
                        data: {
                            token: accessToken || loginData.key,
                            user: {
                                id: loginData.agent_id,
                                username: credentials.identifier,
                                email: credentials.identifier,
                            },
                        },
                    };
                }

                return {
                    success: false,
                    message: loginData.message || 'Invalid credentials',
                };
            }

            return {
                success: false,
                message: response.message || 'Login failed. Please try again.',
            };
        } catch (error) {
            const apiError = this.handleError(error);
            return {
                success: false,
                message: apiError.message || 'Login failed. Please try again.',
            };
        }
    }

    /**
     * Request OTP for mobile number
     */
    async requestMobileOTP(
        mobile: string
    ): Promise<OTPResponse> {
        try {
            const uniqueId = uuidv4();

            const requestData: MobileOTPRequest = {
                mob_num: mobile,
                unique_id: uniqueId,
                src: APP_CONFIG.SRC,
                message_template_id: APP_CONFIG.MESSAGE_TEMPLATE_ID,
            };

            const response = await this.post<GenerateOTPResponse>(
                API_ENDPOINTS.NOTIFICATION.GENERATE_OTP,
                requestData
            );

            if (response.success && response.data) {
                const otpData = response.data;

                if (otpData.status === 'success') {
                    // Store unique_id and reference_id for OTP verification
                    localStorage.setItem('otp_unique_id', uniqueId);
                    localStorage.setItem('otp_reference_id', otpData.reference_id);
                    localStorage.setItem('otp_mobile', mobile);

                    return {
                        success: true,
                        message: otpData.message || 'OTP sent successfully to your mobile',
                        data: {
                            reference_id: otpData.reference_id,
                            expiresIn: 300, // 5 minutes
                        },
                    };
                }

                return {
                    success: false,
                    message: otpData.message || 'Failed to send OTP',
                };
            }

            return {
                success: false,
                message: response.message || 'Failed to send OTP',
            };
        } catch (error) {
            const apiError = this.handleError(error);
            return {
                success: false,
                message: apiError.message || 'Failed to send OTP. Please try again.',
            };
        }
    }

    /**
     * Verify OTP and login
     */
    async verifyOTP(mobile: string, otp: string): Promise<AuthResponse> {
        try {
            const referenceId = localStorage.getItem('otp_reference_id');
            const uniqueId = localStorage.getItem('otp_unique_id') || '';

            if (!referenceId) {
                return {
                    success: false,
                    message: 'OTP session expired. Please request a new OTP.',
                };
            }

            const requestData: VerifyOTPRequest = {
                mob_num: mobile,
                otp: otp,
                unique_id: uniqueId,
                reference_id: referenceId,
                message_template_id: APP_CONFIG.MESSAGE_TEMPLATE_ID,
                src: APP_CONFIG.SRC,
            };

            const response = await this.post<VerifyOTPResponse>(
                API_ENDPOINTS.NOTIFICATION.VERIFY_OTP,
                requestData
            );

            if (response.success && response.data) {
                const verifyData = response.data;

                if (verifyData.status === 'success') {
                    // Clear OTP session data
                    localStorage.removeItem('otp_unique_id');
                    localStorage.removeItem('otp_reference_id');
                    localStorage.removeItem('otp_mobile');

                    // Decrypt the auth key and store tokens
                    let accessToken = '';
                    let refreshToken = '';

                    if (APP_CONFIG.DECRYPTION_KEY && verifyData.key) {
                        try {
                            [accessToken, refreshToken] = decryptAuthKey(
                                verifyData.key,
                                APP_CONFIG.DECRYPTION_KEY,
                                true // isAgent = true for agent app
                            );
                        } catch (error) {
                            console.error('Failed to decrypt auth key:', error);
                            // Fallback: store encrypted key if decryption fails
                            localStorage.setItem('auth_token', verifyData.key);
                        }
                    } else {
                        // Fallback: store encrypted key if decrypt token is not configured
                        localStorage.setItem('auth_token', verifyData.key);
                    }

                    // Store agent ID and user data (matching auth_api.md localStorage keys)
                    localStorage.setItem('agent_id', verifyData.agent_id);
                    localStorage.setItem('agentId', verifyData.agent_id);
                    localStorage.setItem('tokenDateAgent', new Date().toISOString());
                    localStorage.setItem(
                        'user',
                        JSON.stringify({
                            id: verifyData.agent_id,
                            mobile: mobile,
                            hasEmailCredentials: verifyData.is_email_login_credentials_present,
                        })
                    );

                    // Dispatch custom event to notify RoleContext to reload roles
                    window.dispatchEvent(new CustomEvent('agentLoggedIn'));

                    return {
                        success: true,
                        message: verifyData.message || 'OTP verified successfully',
                        data: {
                            token: accessToken || verifyData.key, // Use decrypted access token or fallback to encrypted key
                            user: {
                                id: verifyData.agent_id,
                                username: `user_${mobile}`,
                                mobile: mobile,
                            },
                        },
                    };
                }

                return {
                    success: false,
                    message: verifyData.message || 'Invalid OTP. Please try again.',
                };
            }

            return {
                success: false,
                message: response.message || 'OTP verification failed. Please try again.',
            };
        } catch (error) {
            const apiError = this.handleError(error);
            return {
                success: false,
                message: apiError.message || 'OTP verification failed. Please try again.',
            };
        }
    }

    /**
     * Request password reset link
     * Endpoint: POST /send_email_notifications
     */
    async forgotPassword(
        request: ForgotPasswordRequest
    ): Promise<ForgotPasswordResponse> {
        try {
            // Get reset password URL (should be configured in your app)
            const resetPasswordUrl = `${window.location.origin}/reset-password`;

            const requestData: SendEmailNotificationRequest = {
                notification_channel: 'email_notification',
                notification_template_id: 'dsa_portal_reset_password',
                subject: 'Reset Password',
                user_data: {
                    magic_link: resetPasswordUrl,
                    agent_email: request.email,
                },
                recipients: [request.email],
            };

            const response = await this.post<SendEmailNotificationResponse>(
                '/send_email_notifications',
                requestData
            );

            if (response.success && response.data) {
                const emailData = response.data;

                if (emailData.status === 'success') {
                    return {
                        success: true,
                        message: emailData.message || 'Password reset link has been sent to your email',
                    };
                }

                return {
                    success: false,
                    message: emailData.message || 'Failed to send reset link',
                };
            }

            return {
                success: false,
                message: response.message || 'Failed to send reset link. Please try again.',
            };
        } catch (error) {
            const apiError = this.handleError(error);
            return {
                success: false,
                message: apiError.message || 'Failed to send reset link. Please try again.',
            };
        }
    }
}

// Singleton instance following Dependency Inversion Principle
export const authApi = new AuthApi();
