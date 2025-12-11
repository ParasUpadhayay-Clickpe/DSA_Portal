import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, OTPInput } from '@/components/common';
import { ForgotPasswordModal } from '@/components/ui/ForgotPasswordModal';
import { useAuth } from '@/hooks/useAuth';
import {
    loginCredentialsSchema,
    mobileOTPRequestSchema,
    type LoginCredentialsInput,
    type MobileOTPRequestInput,
} from '@/validations/authValidations';
import ClickPeLogo from '@/assets/images/ClickPe_Logo.png';
import styles from './Login.module.css';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const {
        loginWithCredentials,
        requestOTP,
        verifyOTP,
        isAuthenticated,
        isRequestingOTP,
        isVerifyingOTP,
    } = useAuth();

    const [loginType, setLoginType] = useState<'username' | 'mobile'>('username');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Email/Password form state
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // Mobile/OTP form state
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const handleUsernameLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const validatedData: LoginCredentialsInput =
                loginCredentialsSchema.parse({
                    identifier,
                    password,
                });

            setIsLoggingIn(true);
            const response = await loginWithCredentials(validatedData);

            if (response.success) {
                setSuccess('Login successful! Redirecting...');
                setTimeout(() => {
                    navigate('/');
                }, 1000);
            } else {
                setError(response.message);
            }
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Please check your credentials');
            }
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const validatedData: MobileOTPRequestInput =
                mobileOTPRequestSchema.parse({
                    mobile,
                });

            const response = await requestOTP(validatedData.mobile);

            if (response.success) {
                setOtpSent(true);
                setSuccess('OTP sent successfully to your mobile!');
            } else {
                setError(response.message);
            }
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Please enter a valid 10-digit mobile number');
            }
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            // Validate OTP format (4 digits)
            if (!/^[0-9]{4}$/.test(otp)) {
                setError('OTP must be exactly 4 digits');
                return;
            }

            // Validate mobile format (10 digits)
            if (!/^[0-9]{10}$/.test(mobile)) {
                setError('Mobile number must be exactly 10 digits');
                return;
            }

            const response = await verifyOTP(mobile, otp);

            if (response.success) {
                setSuccess('Login successful! Redirecting...');
                setTimeout(() => {
                    navigate('/');
                }, 1000);
            } else {
                setError(response.message);
            }
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Please enter a valid 4-digit OTP');
            }
        }
    };

    const handleResendOTP = () => {
        setOtpSent(false);
        setOtp('');
        setError('');
        setSuccess('');
    };

    return (
        <div className={styles.loginContainer}>
            {/* Animated Background Elements */}
            <div className={styles.backgroundElements}>
                <div className={styles.floatingShape} style={{ '--delay': '0s', '--duration': '20s' } as React.CSSProperties}></div>
                <div className={styles.floatingShape} style={{ '--delay': '2s', '--duration': '25s' } as React.CSSProperties}></div>
                <div className={styles.floatingShape} style={{ '--delay': '4s', '--duration': '18s' } as React.CSSProperties}></div>
                <div className={styles.floatingShape} style={{ '--delay': '6s', '--duration': '22s' } as React.CSSProperties}></div>
                <div className={styles.floatingShape} style={{ '--delay': '8s', '--duration': '30s' } as React.CSSProperties}></div>
            </div>

            {/* Gradient Orbs */}
            <div className={styles.gradientOrb} style={{ '--x': '10%', '--y': '20%' } as React.CSSProperties}></div>
            <div className={styles.gradientOrb} style={{ '--x': '80%', '--y': '70%' } as React.CSSProperties}></div>
            <div className={styles.gradientOrb} style={{ '--x': '50%', '--y': '50%' } as React.CSSProperties}></div>

            <div className={`${styles.loginCard} loginCard`}>
                <div className={styles.header}>
                    <div className={styles.logoContainer}>
                        <img
                            src={ClickPeLogo}
                            alt="ClickPe Logo"
                            className={styles.logo}
                        />
                    </div>
                    <h1 className={styles.title}>Welcome Back</h1>
                    <p className={styles.subtitle}>Sign in to your account</p>
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${loginType === 'username' ? styles.tabActive : ''
                            }`}
                        onClick={() => {
                            setLoginType('username');
                            setError('');
                            setSuccess('');
                            setOtpSent(false);
                            setOtp('');
                        }}
                    >
                        Username & Password
                    </button>
                    <button
                        className={`${styles.tab} ${loginType === 'mobile' ? styles.tabActive : ''
                            }`}
                        onClick={() => {
                            setLoginType('mobile');
                            setError('');
                            setSuccess('');
                            setOtpSent(false);
                            setOtp('');
                        }}
                    >
                        Mobile & OTP
                    </button>
                </div>

                {/* Error/Success Messages */}
                {error && !otpSent && <div className={styles.errorMessage}>{error}</div>}
                {success && <div className={styles.successMessage}>{success}</div>}

                {/* Username/Password Form */}
                {loginType === 'username' && (
                    <form onSubmit={handleUsernameLogin} className={styles.form}>
                        <Input
                            label="Email or Username"
                            type="text"
                            placeholder="Enter your email or username"
                            value={identifier}
                            onChange={setIdentifier}
                            required
                            fullWidth
                            autoFocus
                        />

                        <Input
                            label="Password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={setPassword}
                            required
                            fullWidth
                        />

                        <div className={styles.forgotPasswordLink}>
                            <button
                                type="button"
                                onClick={() => setShowForgotPassword(true)}
                                className={styles.forgotPasswordButton}
                            >
                                Forgot Password?
                            </button>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            loading={isLoggingIn}
                        >
                            Sign In
                        </Button>
                    </form>
                )}

                {/* Mobile/OTP Form */}
                {loginType === 'mobile' && (
                    <form
                        onSubmit={otpSent ? handleVerifyOTP : handleRequestOTP}
                        className={styles.form}
                    >
                        <Input
                            label="Mobile Number"
                            type="tel"
                            placeholder="Enter 10-digit mobile number"
                            value={mobile}
                            onChange={setMobile}
                            required
                            fullWidth
                            maxLength={10}
                            disabled={otpSent}
                            autoFocus={!otpSent}
                        />

                        {otpSent && (
                            <>
                                <OTPInput
                                    label="Enter OTP"
                                    length={4}
                                    value={otp}
                                    onChange={setOtp}
                                    error={error && otp.length === 4 ? error : undefined}
                                    required
                                    autoFocus
                                />

                                <div className={styles.resendOTP}>
                                    <span className={styles.resendText}>Didn't receive OTP?</span>
                                    <button
                                        type="button"
                                        onClick={handleResendOTP}
                                        className={styles.resendButton}
                                    >
                                        Resend
                                    </button>
                                </div>
                            </>
                        )}

                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            loading={otpSent ? isVerifyingOTP : isRequestingOTP}
                        >
                            {otpSent ? 'Verify OTP' : 'Send OTP'}
                        </Button>
                    </form>
                )}

            </div>

            <ForgotPasswordModal
                isOpen={showForgotPassword}
                onClose={() => setShowForgotPassword(false)}
            />
        </div>
    );
};

