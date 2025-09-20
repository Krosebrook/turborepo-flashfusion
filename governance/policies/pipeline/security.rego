package flashfusion.pipeline.security

import rego.v1

# Policy: Require security scanning in CI/CD
violation[{"msg": msg}] if {
    input.kind == "pipeline"
    input.name
    not "security_scan" in input.stages
    msg := sprintf("Pipeline %s missing security scanning stage", [input.name])
}

# Policy: Secret management
violation[{"msg": msg}] if {
    input.kind == "pipeline_step"
    input.name
    contains(input.script, "export ")
    regex.match(`export\s+\w*(?:PASSWORD|SECRET|KEY|TOKEN)\w*\s*=`, input.script)
    msg := sprintf("Pipeline step %s appears to expose secrets in environment variables", [input.name])
}

# Policy: Deployment approvals
violation[{"msg": msg}] if {
    input.kind == "deployment_job"
    input.environment == "production"
    not input.requires_manual_approval
    msg := sprintf("Production deployment job %s requires manual approval", [input.name])
}

# Policy: Artifact signing
violation[{"msg": msg}] if {
    input.kind == "build_job"
    input.produces_artifacts
    not input.signs_artifacts
    msg := sprintf("Build job %s should sign produced artifacts", [input.name])
}

# Policy: Branch protection
violation[{"msg": msg}] if {
    input.kind == "branch_policy"
    input.branch == "main"
    not input.requires_pull_request_reviews
    msg := "Main branch must require pull request reviews"
}

violation[{"msg": msg}] if {
    input.kind == "branch_policy"
    input.branch == "main"
    input.required_reviewers < 2
    msg := "Main branch requires at least 2 reviewers"
}

# Policy: Container security
violation[{"msg": msg}] if {
    input.kind == "docker_build"
    input.dockerfile
    not input.scans_for_vulnerabilities
    msg := sprintf("Docker build %s should include vulnerability scanning", [input.name])
}

violation[{"msg": msg}] if {
    input.kind == "docker_build"
    input.base_image
    input.base_image == "latest"
    msg := sprintf("Docker build %s should not use 'latest' tag for base image", [input.name])
}