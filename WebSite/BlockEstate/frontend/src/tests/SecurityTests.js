// src/tests/SecurityTests.js

import { validateSecurity, sanitizeInput } from '../utilsApp/security';

export class SecurityTester {
    constructor() {
        this.testCases = {
            simpleScript: "<script>alert('XSS')</script>",
            eventHandlerInjection: "onclick=alert('XSS')",
            javascriptProtocol: "javascript:alert('XSS')",
            htmlEntityEncoding: "&#x3C;script&#x3E;alert('XSS')&#x3C;/script&#x3E;",
            base64Encoding: "data:text/html;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4=",
            nestedScriptTags: "<scr<script>ipt>alert('XSS')</scr</script>ipt>",
            mixedCaseTags: "<ScRiPt>alert('XSS')</sCrIpT>",
            unicodeEscape: "\u003Cscript\u003Ealert('XSS')\u003C/script\u003E",
            sqlInjection: "'; DROP TABLE properties;--",
            imageWithScript: "<img src='x' onerror='alert(1)'>",
            svgWithScript: "<svg><script>alert('XSS')</script></svg>",
            maliciousLink: "<a href='javascript:alert(1)'>Click me</a>",
            styleWithScript: "<style>@import 'javascript:alert(1)'</style>",
            iframeInjection: "<iframe src='javascript:alert(`xss`)'></iframe>",
            metaRefresh: "<meta http-equiv='refresh' content='0;url=javascript:alert(1)'>",
            bodyOnload: "<body onload=alert('XSS')>",
            escapeSequences: "\\x3Cscript\\x3Ealert('XSS')\\x3C/script\\x3E"
        };

        this.propertyFields = ['id', 'title', 'description', 'location', 'price'];
    }

    async runAllTests() {
        console.log('Starting Security Tests...');
        console.log('========================');

        await this.testInputSanitization();
        await this.testFieldValidation();
        await this.testSpecialCharacters();
        await this.testBoundaryValues();

        console.log('========================');
        console.log('Security Tests Completed');
    }

    async testInputSanitization() {
        console.log('\nTesting Input Sanitization:');
        
        Object.entries(this.testCases).forEach(([testName, testValue]) => {
            console.log(`\nTest Case: ${testName}`);
            console.log('Original Value:', testValue);
            
            const sanitized = sanitizeInput(testValue);
            console.log('Sanitized Value:', sanitized);
            
            const containsScripts = /<script|javascript:|data:|on\w+=/.test(sanitized);
            console.log('Security Check:', containsScripts ? 'FAILED ❌' : 'PASSED ✓');
        });
    }

    async testFieldValidation() {
        console.log('\nTesting Field-Specific Validation:');
        
        this.propertyFields.forEach(field => {
            console.log(`\nField: ${field}`);
            
            Object.entries(this.testCases).forEach(([testName, testValue]) => {
                const validated = validateSecurity(testValue, field);
                const isValid = this.validateFieldValue(field, validated);
                
                console.log(`${testName}:`, isValid ? 'PASSED ✓' : 'FAILED ❌');
                if (!isValid) {
                    console.log('Failed Value:', validated);
                }
            });
        });
    }

    async testSpecialCharacters() {
        console.log('\nTesting Special Characters:');
        
        const specialChars = {
            quotes: "'' \"\" `` ",
            angles: "< > << >>",
            slashes: "/ \\ //",
            entities: "&lt; &gt; &quot; &amp;",
            unicode: "漢字 فارسی עִברִית",
            emojis: "🏠🔑💰"
        };

        Object.entries(specialChars).forEach(([charType, chars]) => {
            console.log(`\nTesting ${charType}:`);
            const sanitized = sanitizeInput(chars);
            console.log('Original:', chars);
            console.log('Sanitized:', sanitized);
            console.log('Safe:', this.isValidString(sanitized) ? 'PASSED ✓' : 'FAILED ❌');
        });
    }

    async testBoundaryValues() {
        console.log('\nTesting Boundary Values:');

        const boundaryTests = {
            emptyString: '',
            nullValue: null,
            undefinedValue: undefined,
            longString: 'a'.repeat(1000),
            numberAsString: '12345',
            specialCharsOnly: '!@#$%^&*()',
            mixedContent: 'Normal text <script>alert(1)</script> more text'
        };

        Object.entries(boundaryTests).forEach(([testName, value]) => {
            console.log(`\nTest: ${testName}`);
            try {
                const sanitized = sanitizeInput(value);
                console.log('Original:', value);
                console.log('Sanitized:', sanitized);
                console.log('Valid:', this.isValidString(sanitized) ? 'PASSED ✓' : 'FAILED ❌');
            } catch (error) {
                console.log('Error:', error.message, '❌');
            }
        });
    }

    validateFieldValue(field, value) {
        switch (field) {
            case 'id':
                return /^[a-zA-Z0-9-]*$/.test(value);
            case 'title':
                return value.length <= 100 && !/[<>]/.test(value);
            case 'description':
                return value.length <= 500 && !/[<>]/.test(value);
            case 'price':
                return /^\d*\.?\d*$/.test(value);
            case 'location':
                return typeof value === 'string' && !/[<>]/.test(value);
            default:
                return false;
        }
    }

    isValidString(value) {
        return typeof value === 'string' && 
               !/<[^>]*>/.test(value) && 
               !/javascript:|data:|on\w+=/.test(value);
    }

    generateTestReport() {
        return {
            timestamp: new Date().toISOString(),
            totalTests: Object.keys(this.testCases).length * this.propertyFields.length,
            testCases: this.testCases,
            fields: this.propertyFields
        };
    }
}

// Usage example:
const runSecurityTests = async () => {
    const tester = new SecurityTester();
    await tester.runAllTests();
    const report = tester.generateTestReport();
    console.log('\nTest Report:', report);
};

export default runSecurityTests;