#!/bin/bash

# AWS API Gateway WebSocket API Deployment Script
# This script creates a complete WebSocket API with routes, integrations, and stages

set -e

# Configuration
API_NAME="AWS_WEBSOCKET_API"
REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
STAGE=${1:-dev}

echo "🚀 Deploying WebSocket API: $API_NAME"
echo "📍 Region: $REGION"
echo "🎯 Stage: $STAGE"
echo "🔢 Account ID: $ACCOUNT_ID"

# Function to create API
create_api() {
    echo "📝 Creating WebSocket API..."
    
    aws apigatewayv2 create-api \
        --name "$API_NAME" \
        --protocol-type WEBSOCKET \
        --route-selection-expression '$request.body.action' \
        --description "WebSocket API for real-time communication" \
        --tags Environment=$STAGE,Project=FlashFusion \
        --query 'ApiId' \
        --output text
}

# Function to create routes
create_routes() {
    local api_id=$1
    echo "🛣️  Creating routes..."
    
    # $connect route
    aws apigatewayv2 create-route \
        --api-id $api_id \
        --route-key '$connect' \
        --authorization-type NONE \
        --operation-name ConnectRoute
    
    # $disconnect route  
    aws apigatewayv2 create-route \
        --api-id $api_id \
        --route-key '$disconnect' \
        --authorization-type NONE \
        --operation-name DisconnectRoute
    
    # $default route
    aws apigatewayv2 create-route \
        --api-id $api_id \
        --route-key '$default' \
        --authorization-type NONE \
        --operation-name DefaultRoute
    
    # Custom routes
    for route in "sendMessage" "broadcast" "joinRoom" "leaveRoom"; do
        aws apigatewayv2 create-route \
            --api-id $api_id \
            --route-key $route \
            --authorization-type NONE \
            --operation-name "${route}Route"
    done
}

# Function to create integrations
create_integrations() {
    local api_id=$1
    echo "🔗 Creating integrations..."
    
    # Lambda function names mapping
    declare -A lambda_functions=(
        ['$connect']="websocket-connect-handler"
        ['$disconnect']="websocket-disconnect-handler" 
        ['$default']="websocket-default-handler"
        ['sendMessage']="websocket-send-message-handler"
        ['broadcast']="websocket-broadcast-handler"
        ['joinRoom']="websocket-join-room-handler"
        ['leaveRoom']="websocket-leave-room-handler"
    )
    
    for route_key in "${!lambda_functions[@]}"; do
        lambda_function=${lambda_functions[$route_key]}
        integration_uri="arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:$lambda_function/invocations"
        
        integration_id=$(aws apigatewayv2 create-integration \
            --api-id $api_id \
            --integration-type AWS_PROXY \
            --integration-uri $integration_uri \
            --integration-method POST \
            --payload-format-version "1.0" \
            --timeout-in-millis 29000 \
            --query 'IntegrationId' \
            --output text)
        
        # Get route ID
        route_id=$(aws apigatewayv2 get-routes \
            --api-id $api_id \
            --query "Items[?RouteKey=='$route_key'].RouteId" \
            --output text)
        
        # Update route with integration
        aws apigatewayv2 update-route \
            --api-id $api_id \
            --route-id $route_id \
            --target "integrations/$integration_id"
    done
}

# Function to create stage
create_stage() {
    local api_id=$1
    echo "🎭 Creating stage: $STAGE..."
    
    # Create deployment first
    deployment_id=$(aws apigatewayv2 create-deployment \
        --api-id $api_id \
        --description "Deployment for $STAGE stage" \
        --query 'DeploymentId' \
        --output text)
    
    # Create stage
    aws apigatewayv2 create-stage \
        --api-id $api_id \
        --stage-name $STAGE \
        --deployment-id $deployment_id \
        --description "$STAGE stage for WebSocket API" \
        --stage-variables environment=$STAGE \
        --default-route-settings DataTraceEnabled=true,LoggingLevel=INFO,ThrottlingBurstLimit=1000,ThrottlingRateLimit=500
}

# Function to grant permissions to Lambda functions
grant_lambda_permissions() {
    local api_id=$1
    echo "🔐 Granting Lambda permissions..."
    
    lambda_functions=("websocket-connect-handler" "websocket-disconnect-handler" "websocket-default-handler" "websocket-send-message-handler" "websocket-broadcast-handler" "websocket-join-room-handler" "websocket-leave-room-handler")
    
    for func in "${lambda_functions[@]}"; do
        echo "Granting permission to $func..."
        aws lambda add-permission \
            --function-name $func \
            --statement-id allow-api-gateway-$RANDOM \
            --action lambda:InvokeFunction \
            --principal apigateway.amazonaws.com \
            --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$api_id/*" \
            2>/dev/null || echo "Permission may already exist for $func"
    done
}

# Main deployment flow
main() {
    # Create API
    API_ID=$(create_api)
    echo "✅ API created with ID: $API_ID"
    
    # Create routes
    create_routes $API_ID
    echo "✅ Routes created"
    
    # Create integrations
    create_integrations $API_ID
    echo "✅ Integrations created"
    
    # Create stage
    create_stage $API_ID
    echo "✅ Stage created"
    
    # Grant Lambda permissions
    grant_lambda_permissions $API_ID
    echo "✅ Lambda permissions granted"
    
    # Get WebSocket URL
    WEBSOCKET_URL="wss://$API_ID.execute-api.$REGION.amazonaws.com/$STAGE"
    
    echo ""
    echo "🎉 Deployment Complete!"
    echo "📋 API Details:"
    echo "   API ID: $API_ID"
    echo "   WebSocket URL: $WEBSOCKET_URL"
    echo "   Region: $REGION"
    echo "   Stage: $STAGE"
    echo ""
    echo "🔗 To test your WebSocket API, use:"
    echo "   wscat -c $WEBSOCKET_URL"
    echo ""
}

# Run deployment
main