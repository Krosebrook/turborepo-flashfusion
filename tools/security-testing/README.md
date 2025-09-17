# FlashFusion Security Chaos Agent

A comprehensive security testing suite designed to stress test and find vulnerabilities in the FlashFusion API platform. This tool performs fuzz testing, stress testing, and vulnerability scanning to ensure the system's resilience against malicious inputs and attacks.

## 🛡️ Features

### Security Chaos Agent (Fuzz Testing)
- **SQL Injection Testing**: Tests for various SQL injection vulnerabilities
- **XSS Testing**: Cross-site scripting vulnerability detection
- **Command Injection**: Tests for command injection vulnerabilities
- **Path Traversal**: Directory traversal attack testing
- **Buffer Overflow**: Tests system resilience against large payloads
- **NoSQL Injection**: MongoDB and other NoSQL injection testing
- **Malformed Request Testing**: Tests with invalid JSON, headers, and methods
- **Rate Limiting Validation**: Ensures proper rate limiting is in place
- **Authentication Testing**: Tests for authentication bypass vulnerabilities

### API Stress Tester
- **Connection Flood Testing**: Tests system behavior under high connection load
- **Slowloris Attack Simulation**: Tests for slow request vulnerabilities
- **Large Payload Testing**: Tests with payloads from 1KB to 10MB
- **Rapid Fire Testing**: High-frequency request testing
- **Memory Exhaustion Testing**: Tests with memory-intensive payloads
- **Concurrent Load Testing**: Tests system stability under concurrent access

### Vulnerability Scanner
- **OWASP Top 10 Coverage**: Tests for common web application vulnerabilities
- **Authentication Bypass Testing**: Tests for weak authentication mechanisms
- **Information Disclosure**: Scans for exposed sensitive information
- **Security Headers Analysis**: Checks for missing security headers
- **SSRF (Server-Side Request Forgery)**: Tests for SSRF vulnerabilities
- **XXE (XML External Entity)**: Tests for XML injection vulnerabilities
- **LDAP Injection**: Tests for LDAP injection vulnerabilities

## 🚀 Quick Start

### Prerequisites
- Node.js 14.0.0 or higher
- Network access to the target FlashFusion API

### Installation
```bash
# Clone the repository or copy the security testing files
cd security-chaos-agent

# Make scripts executable
chmod +x *.js
```

### Basic Usage

#### Run All Security Tests
```bash
# Test against localhost
node test-runner.js

# Test against custom target
node test-runner.js --baseUrl https://your-api.example.com

# Test with custom output directory
node test-runner.js --baseUrl http://localhost:3000 --outputDir ./security-results
```

#### Run Individual Test Suites

**Fuzz Testing Only:**
```bash
node security-chaos-agent.js --baseUrl http://localhost:3000
```

**Stress Testing Only:**
```bash
node stress-tester.js --baseUrl http://localhost:3000 --concurrency 100 --duration 60
```

**Vulnerability Scanning Only:**
```bash
node vulnerability-scanner.js --baseUrl http://localhost:3000
```

## 📊 Output and Results

### Test Results Location
All test results are saved to `/tmp/security-testing-results/` by default, including:

- `master-security-report.json` - Comprehensive test results
- `security-report.html` - Interactive HTML report
- `fuzz-test-results.json` - Detailed fuzz testing results
- `stress-test-report.json` - Stress testing metrics
- `vulnerability-scan-results.json` - Vulnerability scan findings
- `*.log` - Detailed execution logs

### Understanding Results

#### Vulnerability Severity Levels
- **Critical**: Immediate security risk requiring urgent action
- **High**: Significant security risk that should be addressed quickly
- **Medium**: Moderate security risk that should be addressed
- **Low**: Minor security risk or best practice violation

#### Key Metrics
- **Total Requests**: Number of test requests sent
- **Vulnerabilities Found**: Total security issues discovered
- **Crashes Detected**: Server crashes or 500 errors encountered
- **Response Times**: Performance metrics during testing
- **Error Rate**: Percentage of failed requests

## 🔧 Configuration Options

### Environment Variables
```bash
# Target URL for testing
export TARGET_URL=http://localhost:3000

# Custom output directory
export OUTPUT_DIR=./security-results

# Testing configuration
export MAX_CONCURRENCY=50
export TEST_DURATION=60
export REQUEST_TIMEOUT=5000
```

### Command Line Options

#### test-runner.js (Master Test Runner)
```bash
--baseUrl <url>           # Target URL (default: http://localhost:3000)
--outputDir <path>        # Output directory (default: /tmp/security-testing-results)
--no-fuzzing             # Skip fuzz testing
--no-stress              # Skip stress testing
--no-vuln-scan           # Skip vulnerability scanning
```

#### security-chaos-agent.js (Fuzz Tester)
```bash
--baseUrl <url>           # Target URL
--maxConcurrent <num>     # Max concurrent requests (default: 10)
--timeout <ms>           # Request timeout (default: 5000)
--logFile <path>         # Log file location
--resultsFile <path>     # Results file location
```

#### stress-tester.js (Stress Tester)
```bash
--baseUrl <url>           # Target URL
--concurrency <num>       # Concurrent connections (default: 100)
--duration <seconds>      # Test duration (default: 60)
--requestsPerSecond <num> # Request rate (default: 100)
--payloadSize <bytes>     # Payload size (default: 1024)
```

## 🎯 Tested Endpoints

The security suite automatically tests the following FlashFusion endpoints:

### Core API Endpoints
- `/` - Root dashboard
- `/health` - Health check endpoint
- `/api/health` - API health endpoint
- `/api/status` - Status endpoint
- `/api/agents/chat` - Agent communication
- `/api/zapier/incoming-webhook` - Zapier webhooks

### Security-Sensitive Endpoints
- `/api/admin` - Admin functionality
- `/api/users` - User management
- `/api/config` - Configuration endpoints
- `/api/auth` - Authentication endpoints
- `/api/files` - File operations
- `/api/upload` - Upload functionality

## 🔍 Vulnerability Types Detected

### Injection Attacks
- SQL Injection (MySQL, PostgreSQL, SQLite)
- NoSQL Injection (MongoDB)
- Command Injection
- LDAP Injection
- XXE (XML External Entity)

### Cross-Site Scripting (XSS)
- Reflected XSS
- Stored XSS (where applicable)
- DOM-based XSS

### Security Misconfigurations
- Missing security headers
- Insecure cookie settings
- Information disclosure
- Directory traversal
- Server version disclosure

### Authentication & Authorization
- Authentication bypass
- Session management flaws
- Weak password policies
- Missing access controls

### Infrastructure Vulnerabilities
- SSRF (Server-Side Request Forgery)
- Path traversal
- Buffer overflow conditions
- Rate limiting bypass

## 📈 Performance Testing

### Stress Testing Metrics
- **Throughput**: Requests per second
- **Response Time**: Average, P50, P95, P99 percentiles
- **Error Rate**: Percentage of failed requests
- **Connection Limits**: Maximum concurrent connections
- **Memory Usage**: Server memory consumption patterns

### Load Testing Scenarios
1. **Connection Flood**: High concurrent connection testing
2. **Slowloris Attack**: Slow request testing
3. **Large Payload**: Testing with varying payload sizes
4. **Rapid Fire**: High-frequency request bursts
5. **Memory Exhaustion**: Deep nested object testing

## 🚨 Security Warnings

⚠️ **Important Security Considerations:**

1. **Only test systems you own or have explicit permission to test**
2. **Do not run against production systems without proper authorization**
3. **Some tests may cause high server load or temporary service disruption**
4. **Review test results carefully for false positives**
5. **Implement proper monitoring when running tests**

## 📋 Example Test Run

```bash
$ node test-runner.js --baseUrl http://localhost:3000

🚀 Starting Security Chaos Agent Test Suite
Target: http://localhost:3000
Output Directory: /tmp/security-testing-results

🌐 Checking target availability: http://localhost:3000
Target is available - Status: 200

🚀 Starting Security Chaos Agent (Fuzz Testing)...
💪 Starting API Stress Tester...
🔍 Starting Vulnerability Scanner...

🎯 SECURITY CHAOS AGENT - FINAL RESULTS
=======================================
Target: http://localhost:3000
Total Duration: 95s
Tests Run: 3
Passed: 3
Failed: 0
Vulnerabilities Found: 2
Crashes Detected: 0
Errors Encountered: 5

📁 All results saved to: /tmp/security-testing-results
📊 HTML report: /tmp/security-testing-results/security-report.html
```

## 🛠️ Troubleshooting

### Common Issues

**Connection Refused:**
- Ensure the target server is running
- Check if the URL and port are correct
- Verify network connectivity

**High Memory Usage:**
- Reduce concurrency settings
- Decrease payload sizes
- Limit test duration

**False Positives:**
- Review vulnerability details carefully
- Cross-reference with actual system behavior
- Check for custom error handling

### Debug Mode
Add verbose logging by setting:
```bash
export DEBUG=1
node test-runner.js
```

## 🤝 Contributing

To add new security tests or improve existing ones:

1. Follow the existing code structure
2. Add comprehensive logging
3. Include proper error handling
4. Document new vulnerability types
5. Test against known vulnerable applications

## 📄 License

This security testing suite is part of the FlashFusion project and is available under the MIT License.

## ⚠️ Disclaimer

This tool is designed for legitimate security testing purposes only. Users are responsible for ensuring they have proper authorization before testing any systems. The authors are not responsible for any misuse of this tool.