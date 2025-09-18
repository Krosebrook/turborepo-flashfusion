import React from 'react';

// Simple placeholder components until @flashfusion/ui is built
const Button = ({ children, ...props }: any) => <button {...props}>{children}</button>;
const Card = ({ children, ...props }: any) => <div {...props}>{children}</div>;

export default function KnowledgeBase() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>FlashFusion Knowledge Base</h1>
      <p>Documentation and learning platform for FlashFusion development</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
        <Card style={{ padding: '1rem' }}>
          <h3>API Documentation</h3>
          <p>Complete API reference and examples</p>
          <Button>Browse APIs</Button>
        </Card>
        
        <Card style={{ padding: '1rem' }}>
          <h3>Tutorials</h3>
          <p>Step-by-step guides and tutorials</p>
          <Button>Start Learning</Button>
        </Card>
        
        <Card style={{ padding: '1rem' }}>
          <h3>Best Practices</h3>
          <p>Development patterns and guidelines</p>
          <Button>View Guidelines</Button>
        </Card>
        
        <Card style={{ padding: '1rem' }}>
          <h3>FAQ</h3>
          <p>Frequently asked questions and answers</p>
          <Button>Browse FAQ</Button>
        </Card>
      </div>
    </div>
  );
}