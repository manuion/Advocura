/**
 * Validation utility functions for form inputs
 */

// Validate email format
export const validateEmail = (email) => {
    if (!email || !email.trim()) {
        return { isValid: false, error: 'Email is required' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return { isValid: false, error: 'Please enter a valid email address' };
    }

    return { isValid: true, error: null };
};

// Validate phone number (10 digits for Indian numbers)
export const validatePhone = (phone) => {
    if (!phone || !phone.trim()) {
        return { isValid: false, error: 'Phone number is required' };
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone.trim())) {
        return { isValid: false, error: 'Phone number must be exactly 10 digits' };
    }

    return { isValid: true, error: null };
};

// Validate optional phone number (empty is ok, but if provided must be valid)
export const validateOptionalPhone = (phone) => {
    if (!phone || !phone.trim()) {
        return { isValid: true, error: null };
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone.trim())) {
        return { isValid: false, error: 'Phone number must be exactly 10 digits' };
    }

    return { isValid: true, error: null };
};

// Validate optional email (empty is ok, but if provided must be valid)
export const validateOptionalEmail = (email) => {
    if (!email || !email.trim()) {
        return { isValid: true, error: null };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return { isValid: false, error: 'Please enter a valid email address' };
    }

    return { isValid: true, error: null };
};

// Validate password (minimum 6 characters)
export const validatePassword = (password) => {
    if (!password || !password.trim()) {
        return { isValid: false, error: 'Password is required' };
    }

    if (password.length < 6) {
        return { isValid: false, error: 'Password must be at least 6 characters' };
    }

    return { isValid: true, error: null };
};

// Format phone number to only contain digits
export const formatPhoneNumber = (phone) => {
    return phone.replace(/[^0-9]/g, '');
};

// Sanitize input to prevent common issues
export const sanitizeInput = (input) => {
    if (!input) return '';
    return input.trim();
};
