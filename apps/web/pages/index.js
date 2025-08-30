import { useState } from 'react';
import { Sparkles, Paperclip, Zap, Users, Settings, BarChart3 } from 'lucide-react';

const FlashFusionLoveable = () => {
  const [promptInput, setPromptInput] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('Multi-Agent AI');
  const [selectedModel, setSelectedModel] = useState('Claude Sonnet 4');
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const templates = [
    'Multi-Agent AI',
    'Business Automation',
    'E-commerce Platform',
    'Content Management',
    'Analytics Dashboard',
    'Custom Workflow'
  ];

  const models = [
    'Claude Sonnet 4',
    'GPT-4 Turbo',
    'Gemini Pro',
    'Multi-AI Orchestration'
  ];

  const handlePromptSubmit = async () => {
    if (!promptInput.trim() || isGenerating) return;
    
    setIsGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      setIsGenerating(false);
      alert(`🚀 FlashFusion is building your ${selectedTemplate} with ${selectedModel}!\\n\\nPrompt: "${promptInput}"`);
    }, 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePromptSubmit();
    }
  };

  const features = [
    {
      icon: Zap,
      title: 'Multi-Agent AI Orchestration',
      description: 'Coordinated AI agents working together on complex business automation'
    },
    {
      icon: Users,
      title: 'Business Workflow Automation',
      description: 'Complete automation of your business processes from lead to revenue'
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics & Insights',
      description: 'Advanced analytics with predictive modeling and business intelligence'
    },
    {
      icon: Settings,
      title: 'Custom Agent Development',
      description: 'Build and deploy your own AI agents for specific business needs'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-transparent" />
      
      {/* Main Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between p-6 backdrop-blur-xl bg-white/5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              FlashFusion
            </h1>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <a href="/fusion-dashboard" className="text-gray-300 hover:text-white transition-colors">Fusion IDE</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">Projects</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">Templates</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">Documentation</a>
            <button className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all">
              Sign In
            </button>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-6 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <h1 
                style={{ fontFamily: 'system-ui' }}
                className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent"
              >
                What do you want to automate?
              </h1>
              <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
                FlashFusion's AI agents work together to build, deploy, and manage your complete business automation system.
              </p>
            </div>

            {/* Prompt Interface */}
            <div className="max-w-4xl mx-auto mb-20">
              <div className="relative">
                <div className="bg-gray-900/30 border border-gray-700/30 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] focus-within:border-purple-500/60 transition-all duration-300">
                  <div className="p-4">
                    <textarea
                      value={promptInput}
                      onChange={(e) => setPromptInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask FlashFusion to build your business automation..."
                      className="w-full bg-transparent text-white placeholder-gray-400 resize-none outline-none"
                      style={{
                        minHeight: '60px',
                        maxHeight: '200px',
                        height: 'auto'
                      }}
                      disabled={isGenerating}
                    />
                    
                    {/* Controls */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-3">
                        {/* Template Selector */}
                        <div className="relative">
                          <button
                            onClick={() => {
                              setShowTemplateDropdown(!showTemplateDropdown);
                              setShowModelDropdown(false);
                            }}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-800/40 hover:bg-gray-700/40 border border-gray-600/30 rounded-lg text-sm text-gray-300 hover:text-white transition-all backdrop-blur-sm"
                          >
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            <span>{selectedTemplate}</span>
                            <svg width="12" height="12" viewBox="0 0 16 16" className={`transition-transform ${showTemplateDropdown ? 'rotate-180' : ''}`}>
                              <path fillRule="evenodd" d="M12.0607 6.74999L8.7071 10.1035C8.31657 10.4941 7.68341 10.4941 7.29288 10.1035L4.46966 7.28032L3.93933 6.74999L4.99999 5.68933L7.99999 8.68933L11 5.68933L12.0607 6.74999Z" fill="currentColor"/>
                            </svg>
                          </button>
                          
                          {showTemplateDropdown && (
                            <div className="absolute top-full left-0 mt-2 w-56 bg-gray-900/90 backdrop-blur-xl border border-gray-600/30 rounded-lg shadow-xl z-50">
                              {templates.map((template) => (
                                <button
                                  key={template}
                                  onClick={() => {
                                    setSelectedTemplate(template);
                                    setShowTemplateDropdown(false);
                                  }}
                                  className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/10 first:rounded-t-lg last:rounded-b-lg transition-all"
                                >
                                  {template}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Model Selector */}
                        <div className="relative">
                          <button
                            onClick={() => {
                              setShowModelDropdown(!showModelDropdown);
                              setShowTemplateDropdown(false);
                            }}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-800/40 hover:bg-gray-700/40 border border-gray-600/30 rounded-lg text-sm text-gray-300 hover:text-white transition-all backdrop-blur-sm"
                          >
                            <span>{selectedModel}</span>
                            <svg width="12" height="12" viewBox="0 0 16 16" className={`transition-transform ${showModelDropdown ? 'rotate-180' : ''}`}>
                              <path fillRule="evenodd" d="M12.0607 6.74999L8.7071 10.1035C8.31657 10.4941 7.68341 10.4941 7.29288 10.1035L4.46966 7.28032L3.93933 6.74999L4.99999 5.68933L7.99999 8.68933L11 5.68933L12.0607 6.74999Z" fill="currentColor"/>
                            </svg>
                          </button>
                          
                          {showModelDropdown && (
                            <div className="absolute top-full left-0 mt-2 w-48 bg-gray-900/90 backdrop-blur-xl border border-gray-600/30 rounded-lg shadow-xl z-50">
                              {models.map((model) => (
                                <button
                                  key={model}
                                  onClick={() => {
                                    setSelectedModel(model);
                                    setShowModelDropdown(false);
                                  }}
                                  className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/10 first:rounded-t-lg last:rounded-b-lg transition-all"
                                >
                                  {model}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                          <Sparkles className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                          <Paperclip className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handlePromptSubmit}
                          disabled={!promptInput.trim() || isGenerating}
                          className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                        >
                          {isGenerating ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M8.70711 1.39644C8.31659 1.00592 7.68342 1.00592 7.2929 1.39644L2.21968 6.46966L1.68935 6.99999L2.75001 8.06065L3.28034 7.53032L7.25001 3.56065V14.25V15H8.75001V14.25V3.56065L12.7197 7.53032L13.25 8.06065L14.3107 6.99999L13.7803 6.46966L8.70711 1.39644Z" />
                            </svg>
                          )}
                        </button>
                        <a 
                          href="/fusion-dashboard"
                          className="ml-3 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all text-sm text-gray-300 hover:text-white"
                        >
                          Try Fusion IDE →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
              {features.map((feature, index) => (
                <div key={index} className="group">
                  <div className="h-full p-6 bg-gray-900/20 border border-gray-700/30 rounded-xl backdrop-blur-sm hover:bg-gray-800/30 hover:border-gray-600/50 transition-all duration-300">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:from-purple-500/30 group-hover:to-blue-500/30 transition-all">
                      <feature.icon className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-400 text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Projects Section */}
            <div className="mb-20">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Your Automation Projects
                  </h2>
                  <p className="text-gray-400">
                    Manage and monitor your FlashFusion automations.
                  </p>
                </div>
                <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg transition-all shadow-lg hover:shadow-xl">
                  New Project
                </button>
              </div>

              {/* Project Cards */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: 'E-commerce Automation', status: 'Active', agents: 5 },
                  { name: 'Content Marketing Hub', status: 'Building', agents: 3 },
                  { name: 'Customer Support AI', status: 'Deployed', agents: 4 }
                ].map((project, index) => (
                  <div key={index} className="group cursor-pointer">
                    <div className="h-full p-6 bg-gray-900/20 border border-gray-700/30 rounded-xl backdrop-blur-sm hover:bg-gray-800/30 hover:border-gray-600/50 transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          project.status === 'Active' ? 'bg-green-500/20 text-green-400' :
                          project.status === 'Building' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-4">
                        {project.agents} AI agents working together
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {[...Array(project.agents)].map((_, i) => (
                            <div key={i} className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full border-2 border-gray-900" />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 ml-2">Active agents</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/10 backdrop-blur-xl bg-white/5 p-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <span>© 2025 FlashFusion</span>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
            <div className="flex items-center gap-4 text-gray-400">
              <span className="text-sm">Powered by Claude Code</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Dropdown Overlay */}
      {(showTemplateDropdown || showModelDropdown) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowTemplateDropdown(false);
            setShowModelDropdown(false);
          }} 
        />
      )}
    </div>
  );
};

export default FlashFusionLoveable;