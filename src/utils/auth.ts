/**
 * Authentication utilities
 * Based on ENCRYPTION_KEYS_USAGE.md
 */

import { SignJWT } from 'jose';

/**
 * Get authorization header for API requests
 * Creates a signed JWT token using the headerSecretKey
 * @param isAgent - Whether this is an agent request (default: true)
 * @returns Promise that resolves to signed JWT token or empty string
 */
export const getAuthorizationHeader = async (isAgent: boolean = true): Promise<string> => {
    const prefix = isAgent ? 'Agent' : '';
    const idKey = isAgent ? 'agentId' : 'userId';

    // Get access token and user/agent ID
    const accessToken = localStorage.getItem(`accessToken${prefix}`);
    const uniqueId = localStorage.getItem(idKey) || localStorage.getItem('agent_id') || localStorage.getItem('agentId');
    const headerSecretKey = localStorage.getItem(`headerSecretKey${prefix}`);

    // If we don't have the required tokens, return empty string
    if (!accessToken || !uniqueId || !headerSecretKey) {
        // Fallback to encrypted auth_token if decryption failed
        const encryptedToken = localStorage.getItem('auth_token');
        if (encryptedToken) {
            console.warn(
                'Using encrypted auth_token as fallback. ' +
                'This indicates token decryption failed. ' +
                'Please check REACT_APP_ENCRYPTION_DEV or REACT_APP_ENCRYPTION_PROD environment variable.'
            );
            return encryptedToken;
        }
        return '';
    }

    // Create JWT payload
    const payload = {
        token: accessToken,
        unique_id: uniqueId,
    };

    try {
        // Sign JWT using headerSecretKey with HS256 algorithm
        const token = await new SignJWT(payload)
            .setProtectedHeader({ alg: 'HS256' })
            .sign(new TextEncoder().encode(headerSecretKey));

        return token;
    } catch (error) {
        console.error('Failed to sign JWT token:', error);
        // Fallback to raw access token if signing fails
        return accessToken;
    }
};

