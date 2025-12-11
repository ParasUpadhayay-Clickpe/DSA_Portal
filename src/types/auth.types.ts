export interface LoginCredentials {
    identifier: string; // Email or username
    password: string;
}

export interface MobileOTPRequest {
    mob_num: string;
    unique_id: string;
    src: string;
    message_template_id: string;
}

export interface GenerateOTPResponse {
    reference_id: string;
    unique_id: string;
    status: string;
    message?: string;
}

export interface VerifyOTPRequest {
    mob_num: string;
    otp: string;
    unique_id: string;
    reference_id: string;
    message_template_id: string;
    src: string;
}

export interface VerifyOTPResponse {
    agent_id: string;
    key: string;
    is_email_login_credentials_present: boolean;
    status?: string;
    message?: string;
}

export interface AgentEmailLoginRequest {
    identifier: string; // Email or username
    password: string;
}

export interface AgentEmailLoginResponse {
    status: string;
    agent_id: string;
    key: string;
    message?: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface SendEmailNotificationRequest {
    notification_channel: string;
    notification_template_id: string;
    subject?: string;
    user_data?: Record<string, unknown>;
    recipients: string[];
    verification_type?: string;
}

export interface SendEmailNotificationResponse {
    status: string;
    message: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data?: {
        token: string;
        user: {
            id: string;
            username: string;
            email?: string;
            mobile?: string;
        };
    };
}

export interface OTPResponse {
    success: boolean;
    message: string;
    data?: {
        reference_id: string;
        expiresIn: number;
    };
}

export interface ForgotPasswordResponse {
    success: boolean;
    message: string;
}

export type LoginType = 'username' | 'mobile';
