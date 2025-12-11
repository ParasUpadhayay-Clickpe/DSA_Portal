import React, { useState } from 'react';
import { Button, Input } from '@/components/common';
import { useAuth } from '@/hooks/useAuth';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/validations/authValidations';
import styles from './ForgotPasswordModal.module.css';

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
    isOpen,
    onClose,
}) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const { forgotPassword, isRequestingReset } = useAuth();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        try {
            const validatedData: ForgotPasswordInput = forgotPasswordSchema.parse({
                email,
            });

            const response = await forgotPassword(validatedData);

            if (response.success) {
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                    setEmail('');
                    setSuccess(false);
                }, 2000);
            } else {
                setError(response.message);
            }
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Please enter a valid email address');
            }
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Forgot Password</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {success ? (
                        <div className={styles.successMessage}>
                            <p className={styles.successText}>
                                Password reset link has been sent to your email!
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className={styles.description}>
                                Enter your email address and we'll send you a link to reset your
                                password.
                            </p>

                            <Input
                                label="Email Address"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={setEmail}
                                error={error}
                                required
                                fullWidth
                                disabled={isRequestingReset}
                                autoFocus
                            />

                            <div className={styles.actions}>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    disabled={isRequestingReset}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    loading={isRequestingReset}
                                    fullWidth
                                >
                                    Send Reset Link
                                </Button>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
};

