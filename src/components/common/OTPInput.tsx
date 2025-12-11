import React, { useRef, useEffect, useState } from 'react';
import styles from './OTPInput.module.css';

interface OTPInputProps {
    length?: number;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    disabled?: boolean;
    autoFocus?: boolean;
    label?: string;
    required?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
    length = 4,
    value,
    onChange,
    error,
    disabled = false,
    autoFocus = false,
    label,
    required = false,
}) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (autoFocus && inputRefs.current[0]) {
            inputRefs.current[0]?.focus();
        }
    }, [autoFocus]);

    const handleChange = (index: number, inputValue: string) => {
        // Only allow numbers
        const numericValue = inputValue.replace(/[^0-9]/g, '');

        if (numericValue.length > 1) {
            // Handle paste: fill multiple inputs
            const pastedValues = numericValue.slice(0, length).split('');
            const newValue = [...value.split('')];

            pastedValues.forEach((char, i) => {
                if (index + i < length) {
                    newValue[index + i] = char;
                }
            });

            const finalValue = newValue.join('').slice(0, length);
            onChange(finalValue);

            // Focus the next empty input or the last one
            const nextIndex = Math.min(index + pastedValues.length, length - 1);
            if (inputRefs.current[nextIndex]) {
                inputRefs.current[nextIndex]?.focus();
                setActiveIndex(nextIndex);
            }
            return;
        }

        // Single character input
        const newValue = value.split('');
        newValue[index] = numericValue;
        const finalValue = newValue.join('').slice(0, length);
        onChange(finalValue);

        // Move to next input if value entered
        if (numericValue && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
            setActiveIndex(index + 1);
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (!value[index] && index > 0) {
                // Move to previous input if current is empty
                inputRefs.current[index - 1]?.focus();
                setActiveIndex(index - 1);
            } else {
                // Clear current input
                const newValue = value.split('');
                newValue[index] = '';
                onChange(newValue.join(''));
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
            setActiveIndex(index - 1);
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
            setActiveIndex(index + 1);
        }
    };

    const handleFocus = (index: number) => {
        setActiveIndex(index);
        // Select all text when focusing
        inputRefs.current[index]?.select();
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
        if (pastedData.length > 0) {
            const newValue = pastedData.slice(0, length);
            onChange(newValue);

            // Focus the next empty input or the last one
            const nextIndex = Math.min(pastedData.length, length - 1);
            if (inputRefs.current[nextIndex]) {
                inputRefs.current[nextIndex]?.focus();
                setActiveIndex(nextIndex);
            }
        }
    };

    return (
        <div className={styles.otpWrapper}>
            {label && (
                <label className={styles.label}>
                    {label}
                    {required && <span className={styles.required}>*</span>}
                </label>
            )}
            <div className={styles.otpContainer}>
                {Array.from({ length }).map((_, index) => (
                    <input
                        key={index}
                        ref={(el) => {
                            inputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={value[index] || ''}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onFocus={() => handleFocus(index)}
                        onPaste={handlePaste}
                        disabled={disabled}
                        className={`${styles.otpInput} ${activeIndex === index ? styles.active : ''} ${error ? styles.error : ''}`}
                        aria-label={`OTP digit ${index + 1}`}
                    />
                ))}
            </div>
            {error && <span className={styles.errorText}>{error}</span>}
        </div>
    );
};

