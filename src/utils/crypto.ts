import CryptoJS from 'crypto-js';

/**
 * Decrypts the encrypted auth key and stores tokens in localStorage
 * @param encryptedKeys - The encrypted key string from the API
 * @param verifyDecryptToken - The token used for decryption
 * @param isAgent - Whether this is an agent login (default: true for agent app)
 * @returns Array containing [access_token, refresh_token]
 */
export const decryptAuthKey = (
    encryptedKeys: string,
    verifyDecryptToken: string,
    isAgent: boolean = true
): [string, string] => {
    const encryptedData = CryptoJS.enc.Base64.parse(encryptedKeys);
    const iv = encryptedData.clone();
    iv.sigBytes = 16;
    iv.clamp();

    const ciphertext = encryptedData.clone();
    ciphertext.words.splice(0, 4);
    ciphertext.sigBytes -= 16;

    const key = CryptoJS.enc.Utf8.parse(verifyDecryptToken);

    // Create CipherParams object for CryptoJS
    const cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: ciphertext,
    });

    const decrypted = CryptoJS.AES.decrypt(
        cipherParams,
        key,
        { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
    );

    const keys = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));

    const prefix = isAgent ? 'Agent' : '';
    localStorage.setItem(`accessToken${prefix}`, keys.access_token);
    localStorage.setItem(`refreshToken${prefix}`, keys.refresh_token);
    localStorage.setItem(`headerSecretKey${prefix}`, keys.header_secret_key);
    localStorage.setItem(`bodySecretKey${prefix}`, keys.body_secret_key);

    return [keys.access_token, keys.refresh_token];
};

