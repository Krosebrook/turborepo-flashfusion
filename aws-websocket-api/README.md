# AWS WebSocket API Configuration

Complete AWS API Gateway WebSocket API setup with routes, integrations, stages, and deployment scripts.

## 📁 Project Structure

```
aws-websocket-api/
├── config/
│   └── api-gateway.json      # Main API configuration
├── routes/
│   └── routes.json           # WebSocket routes definition
├── integrations/
│   └── integrations.json     # Lambda integrations setup
├── stages/
│   └── stages.json          # Development stages configuration
├── scripts/
│   ├── deploy.sh            # Bash deployment script
│   └── deploy.ps1           # PowerShell deployment script
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- AWS CLI installed and configured
- Appropriate IAM permissions for API Gateway and Lambda
- Lambda functions deployed (see integration configuration)

### Deployment

**Option 1: Bash Script (Linux/macOS/WSL)**
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh [stage]
```

**Option 2: PowerShell Script (Windows)**
```powershell
.\scripts\deploy.ps1 -Stage [stage]
```

**Available stages:** `dev`, `staging`, `prod`

## 📋 API Configuration

### API Details
- **Name:** `AWS_WEBSOCKET_API`
- **Protocol:** WebSocket
- **IP Address Type:** IPv4
- **Route Selection Expression:** `$request.body.action`

### Routes

| Route Key | Description | Lambda Handler |
|-----------|-------------|----------------|
| `$connect` | Connection establishment | `websocket-connect-handler` |
| `$disconnect` | Connection termination | `websocket-disconnect-handler` |
| `$default` | Default/fallback route | `websocket-default-handler` |
| `sendMessage` | Send message to specific client | `websocket-send-message-handler` |
| `broadcast` | Broadcast to all clients | `websocket-broadcast-handler` |
| `joinRoom` | Join specific room/channel | `websocket-join-room-handler` |
| `leaveRoom` | Leave specific room/channel | `websocket-leave-room-handler` |

### Stages

| Stage | Description | Throttle Limits | Logging Level |
|-------|-------------|----------------|---------------|
| `dev` | Development testing | 1000/500 | DEBUG |
| `staging` | Pre-production | 2000/1000 | INFO |
| `prod` | Production | 5000/2000 | WARN |

## 🔧 Configuration Files

### API Gateway Configuration
- Main API settings including CORS, throttling, and default route settings
- Located in `config/api-gateway.json`

### Routes Configuration
- Defines all WebSocket routes and their mappings
- Located in `routes/routes.json`

### Integrations Configuration
- Lambda function integrations for each route
- Located in `integrations/integrations.json`
- **Note:** Update `ACCOUNT_ID` placeholders with your actual AWS account ID

### Stages Configuration
- Environment-specific settings for dev, staging, and production
- Located in `stages/stages.json`

## 📝 Usage Examples

### Client Connection
```javascript
const ws = new WebSocket('wss://your-api-id.execute-api.us-east-1.amazonaws.com/dev');

ws.onopen = function() {
    console.log('Connected to WebSocket API');
};

ws.onmessage = function(event) {
    console.log('Received:', event.data);
};
```

### Sending Messages
```javascript
// Send a message
ws.send(JSON.stringify({
    action: 'sendMessage',
    targetId: 'connection-id',
    message: 'Hello World!'
}));

// Broadcast to all
ws.send(JSON.stringify({
    action: 'broadcast',
    message: 'Hello Everyone!'
}));

// Join a room
ws.send(JSON.stringify({
    action: 'joinRoom',
    room: 'general'
}));
```

## 🧪 Testing

### Using wscat
```bash
# Install wscat
npm install -g wscat

# Connect to your WebSocket API
wscat -c wss://your-api-id.execute-api.us-east-1.amazonaws.com/dev

# Send test messages
{"action": "sendMessage", "message": "test"}
{"action": "broadcast", "message": "hello all"}
{"action": "joinRoom", "room": "general"}
```

### Testing with curl (for HTTP endpoints)
```bash
# Get API information
aws apigatewayv2 get-api --api-id your-api-id

# List routes
aws apigatewayv2 get-routes --api-id your-api-id
```

## 🔐 Required Lambda Functions

Before deploying, ensure these Lambda functions exist:

1. `websocket-connect-handler` - Handles new connections
2. `websocket-disconnect-handler` - Handles disconnections
3. `websocket-default-handler` - Handles unmatched routes
4. `websocket-send-message-handler` - Sends messages to specific clients
5. `websocket-broadcast-handler` - Broadcasts to all clients
6. `websocket-join-room-handler` - Manages room joining
7. `websocket-leave-room-handler` - Manages room leaving

## 🔧 Customization

### Adding New Routes
1. Update `routes/routes.json` with new route definition
2. Update `integrations/integrations.json` with corresponding Lambda integration
3. Create the Lambda function handler
4. Redeploy using the deployment script

### Modifying Throttle Limits
1. Update limits in `config/api-gateway.json` for global settings
2. Update stage-specific limits in `stages/stages.json`
3. Redeploy the API

### Environment Variables
Update the deployment scripts with your specific:
- AWS Region
- Account ID
- Lambda function names
- Stage names

## 📊 Monitoring

The API includes:
- CloudWatch logging for all stages
- Access logs with detailed request information
- Throttling metrics
- Error tracking

Log groups are created automatically:
- `websocket-api-dev-logs`
- `websocket-api-staging-logs`
- `websocket-api-prod-logs`

## 🔍 Troubleshooting

### Common Issues
1. **Lambda permissions** - Ensure API Gateway can invoke your Lambda functions
2. **Route selection** - Verify your `$request.body.action` matches route keys
3. **Integration timeouts** - Check Lambda function execution time
4. **CORS issues** - Update CORS configuration in `config/api-gateway.json`

### Debugging
1. Check CloudWatch logs for Lambda functions
2. Enable API Gateway execution logs
3. Use AWS X-Ray for distributed tracing
4. Test individual routes using wscat

## 🚮 Cleanup

To remove the API:
```bash
aws apigatewayv2 delete-api --api-id your-api-id
```

## 📚 Additional Resources

- [AWS API Gateway WebSocket Documentation](https://docs.aws.amazon.com/apigateway/latest/developerguide/websocket-api.html)
- [Lambda Function Examples](https://github.com/aws-samples/simple-websockets-chat-app)
- [WebSocket Testing Tools](https://github.com/websockets/wscat)