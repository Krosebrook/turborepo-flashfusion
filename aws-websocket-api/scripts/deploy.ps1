# AWS API Gateway WebSocket API Deployment Script (PowerShell)
# This script creates a complete WebSocket API with routes, integrations, and stages

param(
    [Parameter(Mandatory=$false)]
    [string]$Stage = "dev"
)

# Configuration
$API_NAME = "AWS_WEBSOCKET_API"
$REGION = "us-east-1"
$ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text)

Write-Host "🚀 Deploying WebSocket API: $API_NAME" -ForegroundColor Green
Write-Host "📍 Region: $REGION" -ForegroundColor Yellow
Write-Host "🎯 Stage: $Stage" -ForegroundColor Yellow
Write-Host "🔢 Account ID: $ACCOUNT_ID" -ForegroundColor Yellow

# Function to create API
function Create-API {
    Write-Host "📝 Creating WebSocket API..." -ForegroundColor Blue
    
    $apiId = aws apigatewayv2 create-api `
        --name $API_NAME `
        --protocol-type WEBSOCKET `
        --route-selection-expression '$request.body.action' `
        --description "WebSocket API for real-time communication" `
        --tags "Environment=$Stage,Project=FlashFusion" `
        --query 'ApiId' `
        --output text
    
    return $apiId
}

# Function to create routes
function Create-Routes {
    param([string]$ApiId)
    Write-Host "🛣️  Creating routes..." -ForegroundColor Blue
    
    # $connect route
    aws apigatewayv2 create-route `
        --api-id $ApiId `
        --route-key '$connect' `
        --authorization-type NONE `
        --operation-name ConnectRoute | Out-Null
    
    # $disconnect route  
    aws apigatewayv2 create-route `
        --api-id $ApiId `
        --route-key '$disconnect' `
        --authorization-type NONE `
        --operation-name DisconnectRoute | Out-Null
    
    # $default route
    aws apigatewayv2 create-route `
        --api-id $ApiId `
        --route-key '$default' `
        --authorization-type NONE `
        --operation-name DefaultRoute | Out-Null
    
    # Custom routes
    $routes = @("sendMessage", "broadcast", "joinRoom", "leaveRoom")
    foreach ($route in $routes) {
        aws apigatewayv2 create-route `
            --api-id $ApiId `
            --route-key $route `
            --authorization-type NONE `
            --operation-name "${route}Route" | Out-Null
    }
}

# Function to create integrations
function Create-Integrations {
    param([string]$ApiId)
    Write-Host "🔗 Creating integrations..." -ForegroundColor Blue
    
    # Lambda function names mapping
    $lambdaFunctions = @{
        '$connect' = "websocket-connect-handler"
        '$disconnect' = "websocket-disconnect-handler"
        '$default' = "websocket-default-handler"
        'sendMessage' = "websocket-send-message-handler"
        'broadcast' = "websocket-broadcast-handler"
        'joinRoom' = "websocket-join-room-handler"
        'leaveRoom' = "websocket-leave-room-handler"
    }
    
    foreach ($routeKey in $lambdaFunctions.Keys) {
        $lambdaFunction = $lambdaFunctions[$routeKey]
        $integrationUri = "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${lambdaFunction}/invocations"
        
        $integrationId = aws apigatewayv2 create-integration `
            --api-id $ApiId `
            --integration-type AWS_PROXY `
            --integration-uri $integrationUri `
            --integration-method POST `
            --payload-format-version "1.0" `
            --timeout-in-millis 29000 `
            --query 'IntegrationId' `
            --output text
        
        # Get route ID
        $routeId = aws apigatewayv2 get-routes `
            --api-id $ApiId `
            --query "Items[?RouteKey=='$routeKey'].RouteId" `
            --output text
        
        # Update route with integration
        aws apigatewayv2 update-route `
            --api-id $ApiId `
            --route-id $routeId `
            --target "integrations/$integrationId" | Out-Null
    }
}

# Function to create stage
function Create-Stage {
    param([string]$ApiId)
    Write-Host "🎭 Creating stage: $Stage..." -ForegroundColor Blue
    
    # Create deployment first
    $deploymentId = aws apigatewayv2 create-deployment `
        --api-id $ApiId `
        --description "Deployment for $Stage stage" `
        --query 'DeploymentId' `
        --output text
    
    # Create stage
    aws apigatewayv2 create-stage `
        --api-id $ApiId `
        --stage-name $Stage `
        --deployment-id $deploymentId `
        --description "$Stage stage for WebSocket API" `
        --stage-variables "environment=$Stage" `
        --default-route-settings "DataTraceEnabled=true,LoggingLevel=INFO,ThrottlingBurstLimit=1000,ThrottlingRateLimit=500" | Out-Null
}

# Function to grant permissions to Lambda functions
function Grant-LambdaPermissions {
    param([string]$ApiId)
    Write-Host "🔐 Granting Lambda permissions..." -ForegroundColor Blue
    
    $lambdaFunctions = @(
        "websocket-connect-handler",
        "websocket-disconnect-handler", 
        "websocket-default-handler",
        "websocket-send-message-handler",
        "websocket-broadcast-handler",
        "websocket-join-room-handler",
        "websocket-leave-room-handler"
    )
    
    foreach ($func in $lambdaFunctions) {
        Write-Host "Granting permission to $func..." -ForegroundColor Gray
        try {
            aws lambda add-permission `
                --function-name $func `
                --statement-id "allow-api-gateway-$(Get-Random)" `
                --action lambda:InvokeFunction `
                --principal apigateway.amazonaws.com `
                --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${ApiId}/*" 2>$null
        }
        catch {
            Write-Host "Permission may already exist for $func" -ForegroundColor Yellow
        }
    }
}

# Main deployment flow
try {
    # Create API
    $API_ID = Create-API
    Write-Host "✅ API created with ID: $API_ID" -ForegroundColor Green
    
    # Create routes
    Create-Routes -ApiId $API_ID
    Write-Host "✅ Routes created" -ForegroundColor Green
    
    # Create integrations
    Create-Integrations -ApiId $API_ID
    Write-Host "✅ Integrations created" -ForegroundColor Green
    
    # Create stage
    Create-Stage -ApiId $API_ID
    Write-Host "✅ Stage created" -ForegroundColor Green
    
    # Grant Lambda permissions
    Grant-LambdaPermissions -ApiId $API_ID
    Write-Host "✅ Lambda permissions granted" -ForegroundColor Green
    
    # Get WebSocket URL
    $WEBSOCKET_URL = "wss://$API_ID.execute-api.$REGION.amazonaws.com/$Stage"
    
    Write-Host ""
    Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
    Write-Host "📋 API Details:" -ForegroundColor Cyan
    Write-Host "   API ID: $API_ID" -ForegroundColor White
    Write-Host "   WebSocket URL: $WEBSOCKET_URL" -ForegroundColor White
    Write-Host "   Region: $REGION" -ForegroundColor White
    Write-Host "   Stage: $Stage" -ForegroundColor White
    Write-Host ""
    Write-Host "🔗 To test your WebSocket API, use:" -ForegroundColor Cyan
    Write-Host "   wscat -c $WEBSOCKET_URL" -ForegroundColor White
    Write-Host ""
}
catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}