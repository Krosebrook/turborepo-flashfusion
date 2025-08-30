export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to FlashFusion
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Enterprise-grade turborepo for rapid AI-powered application development
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-3">🚀 High Performance</h2>
            <p className="text-gray-600">
              Turborepo with intelligent caching for lightning-fast builds
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-3">🤖 AI-First</h2>
            <p className="text-gray-600">
              Built-in AI agent patterns and workflow orchestration
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-3">🏗️ Modular</h2>
            <p className="text-gray-600">
              Reusable packages and components for rapid development
            </p>
          </div>
        </div>
        
        <div className="mt-12">
          <a
            href="/docs"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Get Started
          </a>
        </div>
      </div>
    </main>
  )
}