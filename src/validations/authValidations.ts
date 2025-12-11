import { z } from 'zod';

// Install zod if not present: npm install zod

export const loginCredentialsSchema = z.object({
    identifier: z.string().min(1, 'Email or username is required'),
    password: z.string().min(1, 'Password is required'),
});

export const mobileOTPRequestSchema = z.object({
    mobile: z
        .string()
        .regex(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits'),
});

export const verifyOTPSchema = z.object({
    mobile: z
        .string()
        .regex(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits'),
    otp: z.string().regex(/^[0-9]{4}$/, 'OTP must be exactly 4 digits'),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

export type LoginCredentialsInput = z.infer<typeof loginCredentialsSchema>;
export type MobileOTPRequestInput = z.infer<typeof mobileOTPRequestSchema>;
export type VerifyOTPInput = z.infer<typeof verifyOTPSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

