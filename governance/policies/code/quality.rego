package flashfusion.code.quality

import rego.v1

# Policy: Require proper documentation
violation[{"msg": msg}] if {
    input.kind == "function"
    input.name
    not input.has_documentation
    input.is_exported
    msg := sprintf("Exported function %s requires documentation", [input.name])
}

# Policy: Limit function complexity
violation[{"msg": msg}] if {
    input.kind == "function"
    input.name
    input.cyclomatic_complexity > 10
    msg := sprintf("Function %s has high complexity (%d) - consider refactoring", [input.name, input.cyclomatic_complexity])
}

# Policy: Require type annotations
violation[{"msg": msg}] if {
    input.kind == "function"
    input.name
    input.language == "typescript"
    not input.has_return_type
    msg := sprintf("Function %s missing return type annotation", [input.name])
}

# Policy: Limit file size
violation[{"msg": msg}] if {
    input.kind == "file"
    input.path
    input.line_count > 500
    msg := sprintf("File %s is too large (%d lines) - consider splitting", [input.path, input.line_count])
}

# Policy: Require test coverage
violation[{"msg": msg}] if {
    input.kind == "module"
    input.path
    input.is_core_module
    input.test_coverage < 80
    msg := sprintf("Module %s has insufficient test coverage (%d%%) - minimum 80%% required", [input.path, input.test_coverage])
}

# Policy: Naming conventions
violation[{"msg": msg}] if {
    input.kind == "variable"
    input.name
    input.scope == "global"
    not regex.match(`^[A-Z][A-Z0-9_]*$`, input.name)
    msg := sprintf("Global variable %s should use UPPER_SNAKE_CASE", [input.name])
}

violation[{"msg": msg}] if {
    input.kind == "function"
    input.name
    input.is_exported
    not regex.match(`^[a-z][a-zA-Z0-9]*$`, input.name)
    msg := sprintf("Function %s should use camelCase", [input.name])
}

# Policy: Dependency management
violation[{"msg": msg}] if {
    input.kind == "dependency"
    input.name
    input.has_vulnerabilities
    count(input.vulnerabilities) > 0
    msg := sprintf("Dependency %s has %d vulnerabilities", [input.name, count(input.vulnerabilities)])
}