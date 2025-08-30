export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          🚀 FlashFusion TurboRepo Template
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          A modern monorepo template with AI agent integration, session management, and knowledge base
        </p>
        
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">🏗️ Monorepo Structure</h3>
            <p className="text-gray-600">
              Apps, packages, and tools organized with TurboRepo for optimal development experience
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">🤖 AI Agent Patterns</h3>
            <p className="text-gray-600">
              Pre-built patterns for orchestration, context management, and communication
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">🔄 Session Management</h3>
            <p className="text-gray-600">
              Automatic state persistence and context restoration for seamless development
            </p>
          </div>
        </div>

        <div className="mt-12 p-6 bg-white rounded-lg shadow-md text-left">
          <h3 className="text-lg font-semibold mb-4">🎯 Getting Started</h3>
          <div className="space-y-2 text-sm font-mono">
            <div>1. <span className="text-blue-600">npm run dev</span> - Start development</div>
            <div>2. <span className="text-blue-600">npm run build</span> - Build all packages</div>
            <div>3. <span className="text-blue-600">npm test</span> - Run tests</div>
            <div>4. <span className="text-blue-600">turbo gen workspace --name=my-app --type=app</span> - Add new app</div>
            <div>5. <span className="text-blue-600">turbo gen workspace --name=my-lib --type=package</span> - Add shared package</div>
          </div>
        </div>
      </div>
    </main>
  )
}