// src/utils/security.js

// Base input sanitization
export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    
    return input
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .replace(/data:/gi, '')
        .replace(/&lt;|&gt;|&quot;|&#39;|&#x2F;/g, '')
        .replace(/\\x[0-9A-Fa-f]{2}/g, '')
        .replace(/\\u[0-9A-Fa-f]{4}/g, '')
        .replace(/vbscript:/gi, '')
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
        .trim();
};

// Field-specific validation
export const validateSecurity = (value, type) => {
    if (typeof value !== 'string') return value;

    const sanitized = sanitizeInput(value);

    switch (type) {
        case 'id':
            return sanitized.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 50);
        case 'title':
            return sanitized.replace(/[^\w\s-]/g, '').slice(0, 100);
        case 'description':
            return sanitized.slice(0, 500);
        case 'price':
            return sanitized.replace(/[^0-9.]/g, '');
        case 'location':
            return sanitized;
        default:
            return sanitized;
    }
};

// Enhanced form validation with detailed error messages
export const validateFormSecurity = (formData) => {
    const errors = {};
    const xssPatterns = [
        { pattern: /<script/gi, message: 'Script tags are not allowed' },
        { pattern: /javascript:/gi, message: 'JavaScript protocol is not allowed' },
        { pattern: /on\w+=/gi, message: 'Event handlers are not allowed' },
        { pattern: /data:/gi, message: 'Data URI schemes are not allowed' },
        { pattern: /eval\(/gi, message: 'Eval functions are not allowed' },
        { pattern: /Function\(/gi, message: 'Dynamic functions are not allowed' },
        { pattern: /localStorage/gi, message: 'Local storage access is not allowed' },
        { pattern: /sessionStorage/gi, message: 'Session storage access is not allowed' },
        { pattern: /document\.cookie/gi, message: 'Cookie manipulation is not allowed' }
    ];

    Object.entries(formData).forEach(([field, value]) => {
        if (typeof value === 'string') {
            // Check for XSS patterns
            for (const { pattern, message } of xssPatterns) {
                if (pattern.test(value)) {
                    errors[field] = message;
                    break;
                }
            }

            // Field-specific validation
            switch (field) {
                case 'id':
                    if (value.length > 50) {
                        errors[field] = 'ID must not exceed 50 characters';
                    }
                    if (!/^[a-zA-Z0-9-]+$/.test(value)) {
                        errors[field] = 'ID can only contain letters, numbers, and hyphens';
                    }
                    break;
                case 'title':
                    if (value.length > 100) {
                        errors[field] = 'Title must not exceed 100 characters';
                    }
                    if (value.includes('\n')) {
                        errors[field] = 'Title must be a single line';
                    }
                    break;
                case 'description':
                    if (value.length > 500) {
                        errors[field] = 'Description must not exceed 500 characters';
                    }
                    const lines = value.split('\n').length;
                    if (lines > 4) {
                        errors[field] = 'Description cannot exceed 4 lines';
                    }
                    break;
                case 'price':
                    if (!/^\d*\.?\d*$/.test(value)) {
                        errors[field] = 'Price can only contain numbers and decimal point';
                    }
                    const price = parseFloat(value);
                    if (price > 1000000) {
                        errors[field] = 'Price cannot exceed 1,000,000 ETH';
                    }
                    break;
            }
        }
    });

    return errors;
};

// Input sanitization with validation rules
export const sanitizeAndValidateInput = (value, type, maxLength) => {
    if (!value) return value;

    let sanitized = sanitizeInput(value);

    // Apply type-specific validation rules
    switch (type) {
        case 'text':
            sanitized = sanitized.replace(/[^\w\s-]/g, '');
            break;
        case 'number':
            sanitized = sanitized.replace(/[^0-9.]/g, '');
            break;
        case 'multiline':
            sanitized = sanitized.replace(/[^\w\s-.]/g, '');
            break;
    }

    // Apply length limit if specified
    if (maxLength) {
        sanitized = sanitized.slice(0, maxLength);
    }

    return sanitized;
};

// Validate specific property field
export const validatePropertyField = (field, value) => {
    if (!value) return 'This field is required';

    switch (field) {
        case 'id':
            if (!/^[a-zA-Z0-9-]+$/.test(value)) {
                return 'ID can only contain letters, numbers, and hyphens';
            }
            if (value.length > 50) {
                return 'ID must not exceed 50 characters';
            }
            break;
        case 'title':
            if (value.length > 100) {
                return 'Title must not exceed 100 characters';
            }
            if (value.includes('\n')) {
                return 'Title must be a single line';
            }
            break;
        case 'description':
            if (value.length > 500) {
                return 'Description must not exceed 500 characters';
            }
            if (value.split('\n').length > 4) {
                return 'Description cannot exceed 4 lines';
            }
            break;
        case 'price':
            if (!/^\d*\.?\d*$/.test(value)) {
                return 'Please enter a valid number';
            }
            const price = parseFloat(value);
            if (isNaN(price) || price <= 0) {
                return 'Price must be greater than 0';
            }
            if (price > 1000000) {
                return 'Price cannot exceed 1,000,000 ETH';
            }
            break;
    }

    return null;
};