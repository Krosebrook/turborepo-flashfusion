package flashfusion.code.security

import rego.v1

# Policy: No hardcoded secrets in code
violation[{"msg": msg}] if {
    input.kind == "file"
    input.path
    content := input.content
    
    # Check for common secret patterns
    contains(content, "password = \"")
    msg := sprintf("Hardcoded password detected in %s", [input.path])
}

violation[{"msg": msg}] if {
    input.kind == "file"
    input.path
    content := input.content
    
    # Check for API keys
    regex.match(`(api[_-]?key|secret[_-]?key|access[_-]?token)\s*[:=]\s*["'][^"']+["']`, content)
    msg := sprintf("Potential API key or secret detected in %s", [input.path])
}

# Policy: Require security headers in API responses
violation[{"msg": msg}] if {
    input.kind == "api_endpoint"
    input.path
    not input.security_headers.x_content_type_options
    msg := sprintf("Missing X-Content-Type-Options header in %s", [input.path])
}

violation[{"msg": msg}] if {
    input.kind == "api_endpoint"
    input.path
    not input.security_headers.x_frame_options
    msg := sprintf("Missing X-Frame-Options header in %s", [input.path])
}

# Policy: Require input validation for user inputs
violation[{"msg": msg}] if {
    input.kind == "api_endpoint"
    input.method in ["POST", "PUT", "PATCH"]
    input.path
    not input.has_input_validation
    msg := sprintf("Missing input validation for %s %s", [input.method, input.path])
}

# Policy: Require authentication for sensitive endpoints
violation[{"msg": msg}] if {
    input.kind == "api_endpoint"
    input.path
    contains(input.path, "admin")
    not input.requires_authentication
    msg := sprintf("Admin endpoint %s requires authentication", [input.path])
}

# Policy: No console.log in production code
violation[{"msg": msg}] if {
    input.kind == "file"
    input.path
    endswith(input.path, ".ts")
    content := input.content
    contains(content, "console.log")
    msg := sprintf("console.log statement found in %s - use proper logging", [input.path])
}

# Policy: Require error handling in async functions
violation[{"msg": msg}] if {
    input.kind == "file"
    input.path
    endswith(input.path, ".ts")
    content := input.content
    contains(content, "async ")
    not contains(content, "try")
    not contains(content, "catch")
    msg := sprintf("Async function without error handling in %s", [input.path])
}