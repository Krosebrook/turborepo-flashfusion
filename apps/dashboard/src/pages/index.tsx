import React from 'react';

// Simple placeholder components until @flashfusion/ui is built
const Button = ({ children, ...props }: any) => <button {...props}>{children}</button>;
const Card = ({ children, ...props }: any) => <div {...props}>{children}</div>;

export default function Dashboard() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>FlashFusion AI Dashboard</h1>
      <p>Analytics and monitoring interface for AI agents and workflows</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
        <Card style={{ padding: '1rem' }}>
          <h3>Agent Status</h3>
          <p>Monitor AI agent performance and status</p>
          <Button>View Agents</Button>
        </Card>
        
        <Card style={{ padding: '1rem' }}>
          <h3>Workflow Analytics</h3>
          <p>Track workflow execution and metrics</p>
          <Button>View Workflows</Button>
        </Card>
        
        <Card style={{ padding: '1rem' }}>
          <h3>System Health</h3>
          <p>Monitor system performance and health</p>
          <Button>View Health</Button>
        </Card>
      </div>
    </div>
  );
}