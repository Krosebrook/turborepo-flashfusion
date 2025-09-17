package flashfusion.infrastructure.security

import rego.v1

# Policy: Require encryption for data at rest
violation[{"msg": msg}] if {
    input.kind == "database"
    input.name
    not input.encryption_at_rest.enabled
    msg := sprintf("Database %s must have encryption at rest enabled", [input.name])
}

# Policy: Network security groups
violation[{"msg": msg}] if {
    input.kind == "security_group"
    input.name
    rule := input.ingress_rules[_]
    rule.from_port == 22
    rule.cidr_blocks[_] == "0.0.0.0/0"
    msg := sprintf("Security group %s allows SSH from anywhere", [input.name])
}

violation[{"msg": msg}] if {
    input.kind == "security_group"
    input.name
    rule := input.ingress_rules[_]
    rule.from_port == 3389
    rule.cidr_blocks[_] == "0.0.0.0/0"
    msg := sprintf("Security group %s allows RDP from anywhere", [input.name])
}

# Policy: Require resource tagging
violation[{"msg": msg}] if {
    input.kind in ["instance", "database", "storage"]
    input.name
    not input.tags.environment
    msg := sprintf("Resource %s missing required tag: environment", [input.name])
}

violation[{"msg": msg}] if {
    input.kind in ["instance", "database", "storage"]
    input.name
    not input.tags.owner
    msg := sprintf("Resource %s missing required tag: owner", [input.name])
}

# Policy: Backup requirements
violation[{"msg": msg}] if {
    input.kind == "database"
    input.name
    input.environment == "production"
    not input.backup_retention_days >= 30
    msg := sprintf("Production database %s requires minimum 30 days backup retention", [input.name])
}

# Policy: Access control
violation[{"msg": msg}] if {
    input.kind == "iam_policy"
    input.name
    statement := input.statements[_]
    statement.effect == "Allow"
    statement.actions[_] == "*"
    statement.resources[_] == "*"
    msg := sprintf("IAM policy %s grants overly broad permissions (*:*)", [input.name])
}

# Policy: HTTPS enforcement
violation[{"msg": msg}] if {
    input.kind == "load_balancer"
    input.name
    listener := input.listeners[_]
    listener.protocol == "HTTP"
    listener.port == 80
    not listener.redirect_to_https
    msg := sprintf("Load balancer %s should redirect HTTP to HTTPS", [input.name])
}