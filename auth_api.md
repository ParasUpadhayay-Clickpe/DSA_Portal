# Authentication API Documentation

This document provides a complete guide to the authentication system used in the DSA Portal, including all API endpoints, request/response formats, and implementation details.

## Table of Contents

1. [Overview](#overview)
2. [Environment Configuration](#environment-configuration)
3. [Customer Authentication Flow](#customer-authentication-flow)
4. [Agent Authentication Flow](#agent-authentication-flow)
5. [Token Management](#token-management)
6. [Password Reset Flow](#password-reset-flow)
7. [API Endpoints Reference](#api-endpoints-reference)
8. [Encryption Details](#encryption-details)
9. [LocalStorage Keys](#localstorage-keys)

---

## Overview

The authentication system supports two user types:
- **Customers**: Phone number-based OTP authentication
- **Agents (DSA)**: Phone OTP or Email/Password authentication

All authentication flows use a notification service API and return encrypted authentication keys that must be decrypted using environment-specific decryption keys.

---

## Environment Configuration

The system uses environment variables to configure the API base URL and decryption keys:

```javascript
const stage = process.env.VITE_STAGE; // 'dev' or 'prod'
const NOTIF_URL = `https://notification-${stage}.dailype.in`;
const DECRYPTION_KEY = stage === 'prod' 
  ? process.env.VITE_ENCRYPTION_PROD 
  : process.env.VITE_ENCRYPTION_DEV;
```

**Required Environment Variables:**
- `VITE_STAGE`: Environment stage (`dev` or `prod`)
- `VITE_ENCRYPTION_DEV`: Decryption key for development
- `VITE_ENCRYPTION_PROD`: Decryption key for production

---

## Customer Authentication Flow

### Step 1: Send OTP

**Endpoint:** `POST /generate_otp`

**Request:**
```json
{
  "mob_num": "9876543210",
  "unique_id": "uuid-v4-generated",
  "src": "customer_web_app",
  "message_template_id": "customer_login_otp",
  "agent_mob_num": "optional-agent-phone" // Optional, for referrals
}
```

**Response (Success - 200):**
```json
{
  "reference_id": "ref_123456",
  "unique_id": "uuid-v4-generated",
  "status": "success"
}
```

**Response (Error):**
```json
{
  "message": "Error message",
  "status": "error"
}
```

**Implementation Notes:**
- Generate a UUID v4 for `unique_id`
- `agent_mob_num` is optional and used when customer is referred by an agent
- Store `reference_id` and `unique_id` for OTP verification

---

### Step 2: Verify OTP

**Endpoint:** `POST /verify_otp`

**Request:**
```json
{
  "mob_num": "9876543210",
  "otp": "1234",
  "unique_id": "uuid-from-step-1",
  "reference_id": "ref_123456",
  "message_template_id": "customer_login_otp",
  "src": "customer_web_app"
}
```

**Response (Success - 200):**
```json
{
  "user_id": "user_123456",
  "key": "encrypted-base64-key-string",
  "agent_id": "agent_123" // or "selfOnboard" if no agent
}
```

**Response (Error - 401):**
```json
{
  "message": "Invalid OTP"
}
```

**Implementation Notes:**
- The `key` field contains an encrypted authentication token
- Decrypt the key using the environment-specific decryption key
- Check `agent_id` against `referredByAgent` in localStorage if present
- Store decrypted tokens in localStorage (see [Token Management](#token-management))

---

## Agent Authentication Flow

Agents have two authentication methods:

### Method 1: Phone OTP Authentication

#### Step 1: Send Agent OTP

**Endpoint:** `POST /generate_otp`

**Request:**
```json
{
  "mob_num": "9876543210",
  "unique_id": "uuid-v4-generated",
  "src": "agent_app",
  "message_template_id": "agent_login_otp"
}
```

**Response (Success - 200):**
```json
{
  "reference_id": "ref_123456",
  "unique_id": "uuid-v4-generated",
  "status": "success"
}
```

#### Step 2: Verify Agent OTP

**Endpoint:** `POST /verify_otp`

**Request:**
```json
{
  "mob_num": "9876543210",
  "otp": "1234",
  "unique_id": "uuid-from-step-1",
  "reference_id": "ref_123456",
  "message_template_id": "agent_login_otp",
  "src": "agent_app"
}
```

**Response (Success - 200):**
```json
{
  "agent_id": "agent_123456",
  "key": "encrypted-base64-key-string",
  "is_email_login_credentials_present": true // or false
}
```

**Implementation Notes:**
- If `is_email_login_credentials_present` is `false`, agent must complete email onboarding
- Decrypt the `key` using the decryption key with `isAgent: true` flag
- Store agent-specific tokens (see [Token Management](#token-management))

---

### Method 2: Email/Password Authentication

**Endpoint:** `POST /agent_email_login`

**Request:**
```json
{
  "identifier": "agent@example.com", // Email or username
  "password": "password123"
}
```

**Response (Success - 200):**
```json
{
  "status": "success",
  "agent_id": "agent_123456",
  "key": "encrypted-base64-key-string"
}
```

**Response (Error):**
```json
{
  "status": "error",
  "message": "Invalid credentials"
}
```

---

### Agent Email Onboarding (First-Time Setup)

If an agent logs in via phone OTP and `is_email_login_credentials_present` is `false`, they must complete email onboarding:

#### Step 1: Send Email OTP

**Endpoint:** `POST /send_email_notifications`

**Request:**
```json
{
  "notification_channel": "email_notification",
  "notification_template_id": "email_verification",
  "user_data": {
    "name": "Agent",
    "user_id": "agent_onboarding"
  },
  "recipients": ["agent@example.com"],
  "verification_type": "normal"
}
```

**Response (Success - 200):**
```json
{
  "status": "success",
  "message": "OTP sent successfully"
}
```

**Response (Email Already Verified):**
```json
{
  "status": "error",
  "message": "Email is already verified"
}
```

**Note:** If email is already verified, you can skip OTP verification and proceed to password setup.

#### Step 2: Verify Email OTP

**Endpoint:** `POST /verify_email_otp`

**Request:**
```json
{
  "email": "agent@example.com",
  "otp": "123456"
}
```

**Response (Success - 200):**
```json
{
  "status": "success",
  "message": "Email verified successfully"
}
```

**Response (Error - 401):**
```json
{
  "message": "Invalid OTP"
}
```

#### Step 3: Setup Email Password

**Endpoint:** `POST /agent_email_signup`

**Request:**
```json
{
  "email": "agent@example.com",
  "password": "password123",
  "agent_id": "agent_123456"
}
```

**Response (Success - 200):**
```json
{
  "status": "success",
  "message": "Account setup completed successfully"
}
```

**Response (Error):**
```json
{
  "status": "error",
  "message": "Email already in use by another agent"
}
```

**Note:** If email is already in use, you can try the update password endpoint as a fallback.

---

## Password Reset Flow

### Step 1: Request Password Reset

**Endpoint:** `POST /send_email_notifications`

**Request:**
```json
{
  "notification_channel": "email_notification",
  "notification_template_id": "dsa_portal_reset_password",
  "subject": "Reset Password",
  "user_data": {
    "magic_link": "https://your-domain.com/reset-password",
    "agent_email": "agent@example.com"
  },
  "recipients": ["agent@example.com"]
}
```

**Response (Success - 200):**
```json
{
  "status": "success",
  "message": "Email sent successfully"
}
```

**Implementation Notes:**
- The magic link should point to your reset password page
- The backend will generate a link with encoded parameters: `?aid=<agent_id>&m_uid=<base64_email>&ttl=<base64_timestamp>`

### Step 2: Reset Password via Link

**Endpoint:** `POST /agent_update_password`

**Request:**
```json
{
  "email": "agent@example.com",
  "password": "newpassword123",
  "agent_id": "agent_123456"
}
```

**Response (Success - 200):**
```json
{
  "status": "success",
  "message": "Password updated successfully"
}
```

**Response (Error):**
```json
{
  "status": "error",
  "message": "Failed to update password"
}
```

**Implementation Notes:**
- Extract `aid`, `m_uid`, and `ttl` from URL query parameters
- Decode `m_uid` (base64) to get email
- Decode `ttl` (base64) and check if link has expired
- Validate timestamp: `currentTime < expirationTime`

---

## Token Management

### Decrypting Authentication Keys

After successful OTP verification, you receive an encrypted `key` that must be decrypted:

**Decryption Process:**
1. Parse the base64-encoded key
2. Extract the first 16 bytes as the IV (Initialization Vector)
3. Extract the remaining bytes as the ciphertext
4. Decrypt using AES-256-CBC with the environment decryption key
5. Parse the decrypted JSON to extract tokens

**Decrypted Key Structure:**
```json
{
  "access_token": "access_token_string",
  "refresh_token": "refresh_token_string",
  "header_secret_key": "header_secret_key_string",
  "body_secret_key": "body_secret_key_string"
}
```

**Storage:**
- **Customer tokens:** Store with no prefix
  - `accessToken`
  - `refreshToken`
  - `headerSecretKey`
  - `bodySecretKey`
  - `userId`
  - `tokenDate`

- **Agent tokens:** Store with "Agent" prefix
  - `accessTokenAgent`
  - `refreshTokenAgent`
  - `headerSecretKeyAgent`
  - `bodySecretKeyAgent`
  - `agentId` or `agent_id`
  - `tokenDateAgent`

---

### Generating Authorization Headers

For authenticated API requests, generate a JWT token:

**Payload:**
```json
{
  "token": "<accessToken from localStorage>",
  "unique_id": "<userId or agentId from localStorage>"
}
```

**JWT Generation:**
- Algorithm: HS256
- Secret Key: `headerSecretKey` (or `headerSecretKeyAgent` for agents)
- Sign using the secret key

**Header:**
```
Authorization: <generated-jwt-token>
```

---

### Encrypting Request Bodies

For authenticated API requests, encrypt the request body:

**Encryption Process:**
1. Generate a random 16-byte IV
2. Encrypt the JSON stringified body using AES-256-CBC
3. Concatenate IV + ciphertext
4. Base64 encode the result
5. Wrap in JSON with source identifier

**Request Body Format:**
```json
{
  "src": "lender_dashboard",
  "body": "<base64-encrypted-payload>"
}
```

**Content-Type:** `text/plain; charset=utf-8`

**Secret Key:** Use `bodySecretKey` (or `bodySecretKeyAgent` for agents) from localStorage

---

## API Endpoints Reference

### Notification Service Base URL
```
https://notification-{stage}.dailype.in
```

Where `{stage}` is `dev` or `prod`

### Endpoints

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/generate_otp` | POST | No | Send OTP to phone number |
| `/verify_otp` | POST | No | Verify OTP and get auth tokens |
| `/send_email_notifications` | POST | No | Send email notifications/OTP |
| `/verify_email_otp` | POST | No | Verify email OTP |
| `/agent_email_login` | POST | No | Agent email/password login |
| `/agent_email_signup` | POST | No | Setup agent email/password |
| `/agent_update_password` | POST | No | Update agent password |

---

## Encryption Details

### AES-256-CBC Encryption

**Algorithm:** AES-256-CBC  
**Padding:** PKCS7  
**IV:** 16 bytes (random, prepended to ciphertext)  
**Key:** Environment-specific decryption key (32 bytes for AES-256)

### Encryption Flow (Request Body)
1. Generate random 16-byte IV
2. Encrypt JSON string with AES-256-CBC using `bodySecretKey`
3. Concatenate: `IV + ciphertext`
4. Base64 encode the result
5. Wrap: `{"src": "lender_dashboard", "body": "<base64>"}`

### Decryption Flow (Auth Key)
1. Base64 decode the encrypted key
2. Extract first 16 bytes as IV
3. Extract remaining bytes as ciphertext
4. Decrypt with AES-256-CBC using environment decryption key
5. Parse JSON to get tokens

---

## LocalStorage Keys

### Customer Authentication Keys
- `userId` / `user_id`: Customer user ID
- `accessToken`: Access token for API requests
- `refreshToken`: Refresh token (if implemented)
- `headerSecretKey`: Secret for JWT generation
- `bodySecretKey`: Secret for request body encryption
- `tokenDate`: ISO timestamp of token creation
- `encodedMobNum`: Base64-encoded (reversed) phone number
- `referredByAgent`: Agent ID if customer was referred

### Agent Authentication Keys
- `agentId` / `agent_id`: Agent ID
- `accessTokenAgent`: Access token for API requests
- `refreshTokenAgent`: Refresh token (if implemented)
- `headerSecretKeyAgent`: Secret for JWT generation
- `bodySecretKeyAgent`: Secret for request body encryption
- `tokenDateAgent`: ISO timestamp of token creation
- `agentMobNum`: Base64-encoded (reversed) phone number or email

### Common Keys
- `pageId`: Current page identifier (if applicable)

---

## Error Handling

### Common Error Responses

**401 Unauthorized:**
```json
{
  "message": "Invalid OTP"
}
```

**400 Bad Request:**
```json
{
  "message": "Error description",
  "status": "error"
}
```

**500 Internal Server Error:**
```json
{
  "message": "Something went wrong"
}
```

### Error Handling Best Practices

1. Always check response status codes
2. Handle network errors gracefully
3. Validate OTP expiration (if applicable)
4. Clear localStorage on authentication errors
5. Redirect to login on 401 responses

---

## Implementation Example

### Customer Login Flow (JavaScript/TypeScript)

```typescript
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';
import { SignJWT } from 'jose';

const stage = 'dev'; // or 'prod'
const NOTIF_URL = `https://notification-${stage}.dailype.in`;
const DECRYPTION_KEY = 'your-decryption-key';

// Step 1: Send OTP
async function sendOtp(mobNum: string, agentMobNum?: string) {
  const uuid = uuidv4();
  const reqBody = {
    mob_num: mobNum,
    unique_id: uuid,
    src: 'customer_web_app',
    message_template_id: 'customer_login_otp',
    agent_mob_num: agentMobNum || null,
  };

  const response = await fetch(`${NOTIF_URL}/generate_otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqBody),
  });

  const data = await response.json();
  return { success: response.ok, data, uuid };
}

// Step 2: Verify OTP
async function verifyOtp(mobNum: string, otp: string, refId: string, uuid: string) {
  const reqBody = {
    mob_num: mobNum,
    otp,
    unique_id: uuid,
    reference_id: refId,
    message_template_id: 'customer_login_otp',
    src: 'customer_web_app',
  };

  const response = await fetch(`${NOTIF_URL}/verify_otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqBody),
  });

  const data = await response.json();
  
  if (response.ok && data.key) {
    // Decrypt and store tokens
    decryptAndStoreTokens(data.key, false);
    localStorage.setItem('userId', data.user_id);
    localStorage.setItem('tokenDate', new Date().toISOString());
  }
  
  return { success: response.ok, data };
}

// Decrypt authentication key
function decryptAndStoreTokens(encryptedKey: string, isAgent: boolean) {
  const encryptedData = CryptoJS.enc.Base64.parse(encryptedKey);
  const iv = encryptedData.clone();
  iv.sigBytes = 16;
  iv.clamp();

  const ciphertext = encryptedData.clone();
  ciphertext.words.splice(0, 4);
  ciphertext.sigBytes -= 16;

  const key = CryptoJS.enc.Utf8.parse(DECRYPTION_KEY);
  
  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext: ciphertext },
    key,
    { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
  );

  const tokens = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
  
  const prefix = isAgent ? 'Agent' : '';
  localStorage.setItem(`accessToken${prefix}`, tokens.access_token);
  localStorage.setItem(`refreshToken${prefix}`, tokens.refresh_token);
  localStorage.setItem(`headerSecretKey${prefix}`, tokens.header_secret_key);
  localStorage.setItem(`bodySecretKey${prefix}`, tokens.body_secret_key);
}

// Generate authorization header for API requests
async function getAuthHeader(isAgent: boolean = false) {
  const prefix = isAgent ? 'Agent' : '';
  const idKey = isAgent ? 'agentId' : 'userId';
  
  const payload = {
    token: localStorage.getItem(`accessToken${prefix}`),
    unique_id: localStorage.getItem(idKey)
  };
  
  const secretKey = localStorage.getItem(`headerSecretKey${prefix}`) || '';
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .sign(new TextEncoder().encode(secretKey));
    
  return token;
}

// Encrypt request body
function encryptBody(body: any, isAgent: boolean = false) {
  const bodySecretKey = localStorage.getItem(`bodySecretKey${isAgent ? 'Agent' : ''}`) || '';
  const iv = CryptoJS.lib.WordArray.random(16);
  const key = CryptoJS.enc.Utf8.parse(bodySecretKey);
  
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(body), key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  const encryptedPayload = iv.concat(encrypted.ciphertext).toString(CryptoJS.enc.Base64);

  return JSON.stringify({
    src: 'lender_dashboard',
    body: encryptedPayload
  });
}
```

---

## Security Considerations

1. **Never expose decryption keys** in client-side code (use environment variables)
2. **Store tokens securely** in localStorage (consider httpOnly cookies for production)
3. **Validate token expiration** and implement refresh token logic
4. **Use HTTPS** for all API communications
5. **Sanitize user inputs** before sending to API
6. **Implement rate limiting** for OTP requests
7. **Log security events** for audit purposes

---

## Testing

### Test Credentials

For development/testing, use:
- **Phone Number:** Valid 10-digit Indian phone number
- **OTP:** Check backend logs or use test OTP (if configured)
- **Email:** Valid email address for agent testing

### Test Scenarios

1. ✅ Customer login with phone OTP
2. ✅ Customer login with agent referral
3. ✅ Agent login with phone OTP
4. ✅ Agent login with email/password
5. ✅ Agent email onboarding flow
6. ✅ Password reset flow
7. ✅ Token decryption and storage
8. ✅ Authorization header generation
9. ✅ Request body encryption
10. ✅ Error handling for invalid OTP
11. ✅ Error handling for expired tokens
12. ✅ Logout and token cleanup

---

## Support

For issues or questions:
- Check API response status codes and error messages
- Verify environment variables are set correctly
- Ensure decryption keys match the environment
- Review localStorage for stored tokens
- Check network tab for request/response details

---

**Last Updated:** 2024
**Version:** 1.0

