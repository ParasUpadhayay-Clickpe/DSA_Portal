/**
 * Application Configuration
 * Supports dev and prod stages
 */

/**
 * Get current environment stage (dev or prod)
 * Checks REACT_APP_ENV first, then NODE_ENV, defaults to 'dev'
 */
export const getEnvironment = (): 'dev' | 'prod' => {
    const env = process.env.REACT_APP_ENV;
    return env === 'prod' ? 'prod' : 'dev';
};

export const ENVIRONMENT = getEnvironment();
export const IS_PRODUCTION = ENVIRONMENT === 'prod';
export const IS_DEVELOPMENT = ENVIRONMENT === 'dev';


export const BASE_URLS = {
    NOTIFICATION: {
        dev: 'https://notification-dev.dailype.in',
        prod: 'https://notification-prod.dailype.in',
    },
    LOS: {
        dev: 'https://los-dev.dailype.in',
        prod: 'https://los-prod.dailype.in',
    },
    DSA_PORTAL: {
        dev: 'https://dsa-portal-dev.clickpe.ai',
        prod: 'https://dsa-portal-prod.clickpe.ai',
    },
} as const;

/**
 * Get base URL for a service based on current environment
 */
export const getBaseURL = (service: keyof typeof BASE_URLS): string => {
    return BASE_URLS[service][ENVIRONMENT];
};

/**
 * API Endpoints (relative paths)
 */
export const API_ENDPOINTS = {
    NOTIFICATION: {
        GENERATE_OTP: '/generate_otp',
        VERIFY_OTP: '/verify_otp',
        SEND_EMAIL_NOTIFICATIONS: '/send_email_notifications',
        VERIFY_EMAIL_OTP: '/verify_email_otp',
    },
    AGENT: {
        EMAIL_LOGIN: '/agent_email_login',
        EMAIL_SIGNUP: '/agent_email_signup',
        UPDATE_PASSWORD: '/agent_update_password',
    },
} as const;

/**
 * Application Configuration
 */
export const APP_CONFIG = {
    SRC: 'agent_app',
    MESSAGE_TEMPLATE_ID: 'agent_login_otp',
    /**
     * Get decryption key based on current environment
     * Matches auth_api.md: VITE_ENCRYPTION_DEV / VITE_ENCRYPTION_PROD
     * Using REACT_APP prefix for Create React App
     */
    get DECRYPTION_KEY(): string {
        if (IS_PRODUCTION) {
            return process.env.REACT_APP_ENCRYPTION_PROD || '';
        }
        return process.env.REACT_APP_ENCRYPTION_DEV || '';
    },
} as const;

/**
 * Convenience exports for commonly used URLs
 */
export const NOTIFICATION_API_BASE_URL = getBaseURL('NOTIFICATION');
export const LOS_API_BASE_URL = getBaseURL('LOS');
export const DSA_PORTAL_API_BASE_URL = getBaseURL('DSA_PORTAL');

/**
 * External Application URLs
 */
export const EXTERNAL_URLS = {
    AGENT_ONBOARDING: {
        dev: 'https://dev.agent-onboarding.clickpe.ai',
        prod: 'https://agent-onboarding.clickpe.ai',
    },
    LOAN_PORTAL: {
        allLenders: 'https://login.clickpe.ai/login',
        muthootEDI: 'https://muthoot.clickpe.ai',
    },
} as const;

/**
 * Get external URL based on environment
 */
export const getExternalURL = (service: keyof typeof EXTERNAL_URLS): string => {
    if (service === 'LOAN_PORTAL') {
        return EXTERNAL_URLS[service].allLenders; // Default to all lenders
    }
    return EXTERNAL_URLS[service][ENVIRONMENT];
};
