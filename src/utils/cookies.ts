/**
 * Cookie utility functions
 */

/**
 * Get a cookie value by name
 */
export const getCookie = (name: string): string | null => {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
};

/**
 * Set a cookie
 */
export const setCookie = (
    name: string,
    value: string,
    days?: number,
    path: string = '/'
): void => {
    let expires = '';
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = '; expires=' + date.toUTCString();
    }
    document.cookie = `${name}=${value}${expires}; path=${path}`;
};

/**
 * Delete a cookie by name
 */
export const deleteCookie = (name: string, path: string = '/'): void => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
};

/**
 * Clear all cookies
 * Note: This will clear all cookies for the current domain
 */
export const clearAllCookies = (): void => {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name) {
            // Try to delete with different paths
            deleteCookie(name, '/');
            deleteCookie(name, '');
        }
    }
};

