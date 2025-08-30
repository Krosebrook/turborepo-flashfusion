# AI Agents Package

## Overview

The `@flashfusion/ai-agents` package provides enterprise-grade AI agent patterns and implementations for FlashFusion applications. This package contains tested patterns extracted from analysis of 22 repositories and provides a foundation for building scalable AI agent systems.

## Features

- **Agent Orchestration**: Central coordination of multiple AI agents
- **Context Management**: Persistent state across agent interactions  
- **Communication Bus**: Inter-agent messaging and event handling
- **Workflow Engine**: Step-by-step process execution
- **State Persistence**: Reliable state management and recovery

## Core Patterns

### 1. Agent Orchestrator Pattern
Central agent coordination for complex multi-step workflows.

```javascript
import { AgentOrchestrator } from '@flashfusion/ai-agents';

const orchestrator = new AgentOrchestrator();
const result = await orchestrator.executeWorkflow('workflow-id', inputData);
```

### 2. Context Management Pattern
Persistent state management across agent interactions.

```javascript
import { ContextManager } from '@flashfusion/ai-agents';

const contextManager = new ContextManager();
const context = await contextManager.create('workflow-id', initialData);
```

### 3. Communication Bus Pattern
Inter-agent messaging system for coordinated operations.

```javascript
import { AgentCommunicationBus } from '@flashfusion/ai-agents';

const bus = new AgentCommunicationBus();
bus.subscribe('agent-1', 'task-complete', handleTaskComplete);
```

## Installation

```bash
# In your app or package
npm install @flashfusion/ai-agents
```

## Usage Examples

### Basic Agent Workflow

```javascript
import { AgentOrchestrator, ContextManager } from '@flashfusion/ai-agents';

// Initialize components
const orchestrator = new AgentOrchestrator();
const contextManager = new ContextManager();

// Execute workflow
async function runAgentWorkflow(input) {
  const workflowId = 'user-onboarding-workflow';
  const context = await contextManager.create(workflowId, input);
  
  const result = await orchestrator.executeWorkflow(workflowId, context);
  return result;
}
```

### Multi-Agent Communication

```javascript
import { AgentCommunicationBus } from '@flashfusion/ai-agents';

const bus = new AgentCommunicationBus();

// Subscribe to events
bus.subscribe('data-processor', 'data-ready', async (data) => {
  console.log('Processing data:', data);
});

// Broadcast events
await bus.broadcast('data-ready', processedData, 'data-collector');
```

## API Reference

### AgentOrchestrator

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `executeWorkflow()` | Execute a complete workflow | `workflowId, input` | `Promise<Result>` |
| `loadWorkflow()` | Load workflow definition | `workflowId` | `Promise<Workflow>` |
| `registerAgent()` | Register new agent type | `agentType, agentClass` | `void` |

### ContextManager

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `create()` | Create new context | `workflowId, initialData` | `Promise<Context>` |
| `saveState()` | Persist context state | `workflowId` | `Promise<void>` |
| `restoreState()` | Restore saved context | `workflowId` | `Promise<Context>` |

### AgentCommunicationBus

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `subscribe()` | Subscribe to events | `agentId, eventType, handler` | `void` |
| `broadcast()` | Broadcast event | `eventType, data, sourceAgentId` | `Promise<Result[]>` |
| `unsubscribe()` | Remove subscription | `agentId, eventType` | `void` |

## Configuration

Create a `agents.config.js` file in your project root:

```javascript
export default {
  persistence: {
    type: 'file', // 'file' | 'redis' | 'memory'
    path: './agent-state'
  },
  communication: {
    timeout: 30000,
    retries: 3
  },
  workflows: {
    directory: './workflows'
  }
};
```

## Testing

```bash
npm test
```

## Contributing

See the main repository [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT - See [LICENSE](../../LICENSE) for details.