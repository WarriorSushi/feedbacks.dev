# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in feedbacks.dev, please report it responsibly.

**Email:** security@feedbacks.dev

Please include:
- Description of the vulnerability
- Steps to reproduce
- Impact assessment
- Suggested fix (if you have one)

We will acknowledge receipt within 48 hours and aim to provide a fix within 7 days for critical issues.

## Scope

### In Scope
- Authentication and authorization flaws
- Data exposure vulnerabilities
- Cross-site scripting (XSS)
- SQL injection
- Server-side request forgery (SSRF)
- Remote code execution
- Widget security issues

### Out of Scope
- Clickjacking on pages with no sensitive actions
- Unauthenticated/logout CSRF
- Attacks requiring MITM or physical device access
- Social engineering attacks
- Denial of service attacks
- Content spoofing without demonstrated impact
- Missing DNSSEC, CAA, or CSP headers

## Disclosure

We follow responsible disclosure practices. We ask that you give us reasonable time to address the issue before making any public disclosure.

## Recognition

We appreciate security researchers who help keep feedbacks.dev and its users safe. Reporters of valid vulnerabilities will be credited in our security acknowledgments (unless they prefer to remain anonymous).
