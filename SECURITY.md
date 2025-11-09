# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

As the project is currently in early development (pre-1.0), we support only the latest release.

## Reporting a Vulnerability

We take the security of Vibe Coder 3D seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please Do Not

- **Do not** open a public GitHub issue for security vulnerabilities
- **Do not** disclose the vulnerability publicly until it has been addressed
- **Do not** exploit the vulnerability beyond what is necessary to demonstrate it

### Please Do

1. **Email us directly** at joaopaulofurtado@live.com

   - Use a clear, descriptive subject line (e.g., "Security Vulnerability: XSS in Editor Panel")
   - Include detailed steps to reproduce the vulnerability
   - Provide any proof-of-concept code if available
   - For urgent issues, you can also reach out via Discord: trolololo#7071

2. **Provide the following information**:

   - Type of vulnerability (e.g., XSS, CSRF, injection, etc.)
   - Full paths of affected source files
   - Location of the affected code (tag/branch/commit or direct URL)
   - Any special configuration required to reproduce the issue
   - Step-by-step instructions to reproduce the vulnerability
   - Proof-of-concept or exploit code (if possible)
   - Impact of the vulnerability (what an attacker could achieve)

3. **Allow us time to respond**:
   - We will acknowledge receipt within 48 hours
   - We aim to provide a detailed response within 7 days
   - We will keep you informed of our progress

### What to Expect

Once you've submitted a vulnerability report:

1. **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
2. **Assessment**: We will assess the vulnerability and determine its impact
3. **Fix Development**: We will work on a fix for confirmed vulnerabilities
4. **Disclosure Timeline**: We will coordinate with you on responsible disclosure
5. **Credit**: We will credit you in the security advisory (if you wish)

### Responsible Disclosure

We follow the principle of responsible disclosure:

- We request that you give us reasonable time to investigate and mitigate the issue before public disclosure
- We will work with you to understand and resolve the issue promptly
- We will publicly acknowledge your responsible disclosure (with your permission)

### Security Update Process

When we receive a security bug report:

1. We confirm the problem and determine affected versions
2. We audit code to find similar problems
3. We prepare fixes for all supported versions
4. We release new versions as soon as possible
5. We publish a security advisory on GitHub

### Security Best Practices for Contributors

When contributing to Vibe Coder 3D, please:

- **Never commit sensitive data**:

  - API keys, tokens, or credentials
  - Private keys or certificates
  - Passwords or connection strings
  - Personal information

- **Follow secure coding practices**:

  - Validate and sanitize all user input
  - Use parameterized queries to prevent SQL injection
  - Avoid using `eval()` or `Function()` with user input
  - Implement proper access controls
  - Use HTTPS for all external communications

- **Review dependencies**:

  - Keep dependencies up to date
  - Review security advisories for dependencies
  - Use `yarn audit` to check for known vulnerabilities

- **Test security**:
  - Write tests for authentication and authorization
  - Test input validation thoroughly
  - Consider edge cases and malicious input

### Known Security Considerations

#### TypeScript Editor (Web-Based)

- **Script Execution**: The editor uses `DirectScriptExecutor` which executes user-provided TypeScript code. In production deployments:

  - Implement proper sandboxing
  - Validate script sources
  - Consider using Web Workers for isolation

- **Asset Loading**: 3D models and textures are loaded from user-provided sources:
  - Validate file types and sizes
  - Implement upload restrictions
  - Scan uploaded files for malware

#### Rust Native Engine

- **Scene Loading**: JSON scenes are deserialized and executed:

  - Validate scene JSON structure
  - Implement resource limits
  - Sanitize file paths

- **Lua Scripting**: Lua scripts are executed at runtime:
  - Sandbox Lua environment
  - Restrict file system access
  - Limit CPU and memory usage

### Security Tools

We use the following tools to maintain security:

- **yarn audit**: Check for known vulnerabilities in npm packages
- **cargo audit**: Check for known vulnerabilities in Rust crates
- **ESLint security plugin**: Static analysis for JavaScript/TypeScript
- **Clippy**: Rust linting for common security issues

### Questions?

If you have questions about this security policy, please open a GitHub Discussion or contact the maintainers.

## Attribution

This security policy is based on industry best practices and the [Security.md](https://github.com/yoshuawuyts/security-md) template.
