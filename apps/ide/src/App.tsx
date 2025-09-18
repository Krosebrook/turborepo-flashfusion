import React from 'react';
import MonacoEditor from '@monaco-editor/react';

function App() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '1rem', background: '#1e1e1e', color: 'white' }}>
        <h1>FlashFusion IDE</h1>
        <p>Professional development environment with Monaco Editor</p>
      </header>
      <main style={{ flex: 1 }}>
        <MonacoEditor
          height="100%"
          defaultLanguage="typescript"
          defaultValue="// Welcome to FlashFusion IDE
// A professional development environment built with React and Monaco Editor

console.log('Hello, FlashFusion!');"
          theme="vs-dark"
        />
      </main>
    </div>
  );
}

export default App;