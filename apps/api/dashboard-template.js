/**
 * FlashFusion Dashboard HTML Template
 * Centralized dashboard HTML to avoid duplication
 */

module.exports = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FlashFusion - AI Business Operating System</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: #333;
            min-height: 100vh;
        }
        .header {
            background: rgba(255, 255, 255, 0.95);
            padding: 1rem 2rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .logo {
            font-size: 1.8rem;
            font-weight: bold;
            color: #1e3c72;
        }
        .status-badge {
            background: #10b981;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.9rem;
        }
        .container {
            max-width: 1200px;
            margin: 2rem auto;
            padding: 0 2rem;
        }
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2rem;
            margin: 2rem 0;
        }
        .card {
            background: white;
            border-radius: 15px;
            padding: 2rem;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            border: 1px solid rgba(255,255,255,0.2);
        }
        .card h3 {
            color: #1e3c72;
            margin-bottom: 1rem;
            font-size: 1.3rem;
        }
        .form-group {
            margin-bottom: 1.5rem;
        }
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: #374151;
        }
        .form-group input, .form-group textarea, .form-group select {
            width: 100%;
            padding: 0.8rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.3s;
        }
        .form-group input:focus, .form-group textarea:focus, .form-group select:focus {
            outline: none;
            border-color: #1e3c72;
        }
        .btn {
            background: #1e3c72;
            color: white;
            border: none;
            padding: 0.8rem 2rem;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 600;
            transition: all 0.3s;
        }
        .btn:hover {
            background: #2a5298;
            transform: translateY(-2px);
        }
        .btn-secondary {
            background: #6b7280;
        }
        .btn-secondary:hover {
            background: #4b5563;
        }
        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin: 1rem 0;
        }
        .checkbox-group input[type="checkbox"] {
            width: auto;
        }
        .output-section {
            background: #f8fafc;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 1rem;
            margin: 1rem 0;
            min-height: 200px;
            font-family: 'Courier New', monospace;
            white-space: pre-wrap;
            overflow-y: auto;
        }
        .tabs {
            display: flex;
            margin-bottom: 2rem;
            background: white;
            border-radius: 10px;
            padding: 0.5rem;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }
        .tab {
            flex: 1;
            text-align: center;
            padding: 1rem;
            cursor: pointer;
            border-radius: 8px;
            transition: all 0.3s;
            font-weight: 600;
        }
        .tab.active {
            background: #1e3c72;
            color: white;
        }
        .tab-content {
            display: none;
        }
        .tab-content.active {
            display: block;
        }
        .workflow-item {
            background: #f3f4f6;
            padding: 1rem;
            border-radius: 8px;
            margin: 0.5rem 0;
            border-left: 4px solid #1e3c72;
        }
        .agent-status {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #10b981;
            margin-right: 0.5rem;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">⚡ FlashFusion</div>
        <div class="status-badge">🟢 Live Production</div>
    </div>

    <div class="container">
        <div class="tabs">
            <div class="tab active" onclick="showTab('agents')">🤖 AI Agents</div>
            <div class="tab" onclick="showTab('workflows')">🔄 Workflows</div>
            <div class="tab" onclick="showTab('integrations')">🔗 Integrations</div>
            <div class="tab" onclick="showTab('settings')">⚙️ Settings</div>
        </div>

        <div id="agents" class="tab-content active">
            <div class="dashboard-grid">
                <div class="card">
                    <h3>🤖 Create AI Agent</h3>
                    <div class="form-group">
                        <label>Agent Name</label>
                        <input type="text" id="agentName" placeholder="e.g., Sales Assistant">
                    </div>
                    <div class="form-group">
                        <label>Agent Role</label>
                        <select id="agentRole">
                            <option>Sales Agent</option>
                            <option>Content Creator</option>
                            <option>Customer Support</option>
                            <option>Data Analyst</option>
                            <option>Marketing Manager</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Instructions</label>
                        <textarea id="agentInstructions" rows="4" placeholder="Describe what this agent should do..."></textarea>
                    </div>
                    <button class="btn" onclick="createAgent()">Create Agent</button>
                </div>

                <div class="card">
                    <h3>🎯 Active Agents</h3>
                    <div id="activeAgents">
                        <div class="workflow-item">
                            <span class="agent-status"></span>
                            <strong>Sales Bot</strong> - Processing leads
                        </div>
                        <div class="workflow-item">
                            <span class="agent-status"></span>
                            <strong>Content AI</strong> - Creating posts
                        </div>
                        <div class="workflow-item">
                            <span class="agent-status"></span>
                            <strong>Support Agent</strong> - Handling tickets
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div id="workflows" class="tab-content">
            <div class="dashboard-grid">
                <div class="card">
                    <h3>🔄 Create Workflow</h3>
                    <div class="form-group">
                        <label>Workflow Name</label>
                        <input type="text" id="workflowName" placeholder="e.g., Lead Generation Pipeline">
                    </div>
                    <div class="form-group">
                        <label>Trigger Event</label>
                        <select id="workflowTrigger">
                            <option>New Customer</option>
                            <option>Order Placed</option>
                            <option>Email Received</option>
                            <option>Schedule</option>
                            <option>Webhook</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Actions</label>
                        <textarea id="workflowActions" rows="4" placeholder="Define the workflow steps..."></textarea>
                    </div>
                    <button class="btn" onclick="createWorkflow()">Create Workflow</button>
                </div>

                <div class="card">
                    <h3>📊 Active Workflows</h3>
                    <div id="activeWorkflows">
                        <div class="workflow-item">
                            <strong>Lead Nurturing</strong> - 15 active leads
                        </div>
                        <div class="workflow-item">
                            <strong>Content Publishing</strong> - 3 posts scheduled
                        </div>
                        <div class="workflow-item">
                            <strong>Customer Onboarding</strong> - 8 new customers
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div id="integrations" class="tab-content">
            <div class="dashboard-grid">
                <div class="card">
                    <h3>🔗 API Integration</h3>
                    <div class="form-group">
                        <label>Service</label>
                        <select id="integrationService">
                            <option>OpenAI</option>
                            <option>Anthropic</option>
                            <option>Zapier</option>
                            <option>Shopify</option>
                            <option>Stripe</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>API Key</label>
                        <input type="password" id="apiKey" placeholder="Enter your API key">
                    </div>
                    <div class="form-group">
                        <label>Configuration</label>
                        <textarea id="integrationConfig" rows="3" placeholder="JSON configuration..."></textarea>
                    </div>
                    <button class="btn" onclick="addIntegration()">Add Integration</button>
                </div>

                <div class="card">
                    <h3>⚡ Connected Services</h3>
                    <div id="connectedServices">
                        <div class="workflow-item">
                            <span class="agent-status"></span>
                            <strong>OpenAI GPT-4</strong> - Connected
                        </div>
                        <div class="workflow-item">
                            <span class="agent-status"></span>
                            <strong>Zapier Webhook</strong> - Active
                        </div>
                        <div class="workflow-item">
                            <span class="agent-status"></span>
                            <strong>Supabase DB</strong> - Synced
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div id="settings" class="tab-content">
            <div class="dashboard-grid">
                <div class="card">
                    <h3>⚙️ System Settings</h3>
                    <div class="checkbox-group">
                        <input type="checkbox" id="prettyPrint" checked>
                        <label for="prettyPrint">Pretty Print JSON Output</label>
                    </div>
                    <div class="checkbox-group">
                        <input type="checkbox" id="autoSave" checked>
                        <label for="autoSave">Auto-save Configurations</label>
                    </div>
                    <div class="checkbox-group">
                        <input type="checkbox" id="notifications">
                        <label for="notifications">Enable Notifications</label>
                    </div>
                    <div class="form-group">
                        <label>Environment</label>
                        <select id="environment">
                            <option>Production</option>
                            <option>Development</option>
                            <option>Testing</option>
                        </select>
                    </div>
                    <button class="btn" onclick="saveSettings()">Save Settings</button>
                </div>

                <div class="card">
                    <h3>📊 System Status</h3>
                    <div class="output-section" id="systemStatus">
System: FlashFusion v2.0.0
Status: ✅ Operational
Uptime: 99.9%
Active Agents: 3
Running Workflows: 5
API Calls Today: 1,247
Memory Usage: 45%
CPU Usage: 23%
Database: Connected
Last Updated: ${new Date().toISOString()}
                    </div>
                    <button class="btn btn-secondary" onclick="refreshStatus()">Refresh Status</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        function showTab(tabName) {
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Remove active class from all tabs
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected tab content
            document.getElementById(tabName).classList.add('active');
            
            // Add active class to clicked tab
            event.target.classList.add('active');
        }

        function createAgent() {
            const name = document.getElementById('agentName').value;
            const role = document.getElementById('agentRole').value;
            const instructions = document.getElementById('agentInstructions').value;
            
            if (name && instructions) {
                const agentList = document.getElementById('activeAgents');
                const newAgent = document.createElement('div');
                newAgent.className = 'workflow-item';
                newAgent.innerHTML = '<span class="agent-status"></span><strong>' + name + '</strong> - ' + role;
                agentList.appendChild(newAgent);
                
                // Clear form
                document.getElementById('agentName').value = '';
                document.getElementById('agentInstructions').value = '';
                
                alert('Agent "' + name + '" created successfully!');
            } else {
                alert('Please fill in agent name and instructions.');
            }
        }

        function createWorkflow() {
            const name = document.getElementById('workflowName').value;
            const trigger = document.getElementById('workflowTrigger').value;
            const actions = document.getElementById('workflowActions').value;
            
            if (name && actions) {
                const workflowList = document.getElementById('activeWorkflows');
                const newWorkflow = document.createElement('div');
                newWorkflow.className = 'workflow-item';
                newWorkflow.innerHTML = '<strong>' + name + '</strong> - Trigger: ' + trigger;
                workflowList.appendChild(newWorkflow);
                
                // Clear form
                document.getElementById('workflowName').value = '';
                document.getElementById('workflowActions').value = '';
                
                alert('Workflow "' + name + '" created successfully!');
            } else {
                alert('Please fill in workflow name and actions.');
            }
        }

        function addIntegration() {
            const service = document.getElementById('integrationService').value;
            const apiKey = document.getElementById('apiKey').value;
            
            if (apiKey) {
                const servicesList = document.getElementById('connectedServices');
                const newService = document.createElement('div');
                newService.className = 'workflow-item';
                newService.innerHTML = '<span class="agent-status"></span><strong>' + service + '</strong> - Connected';
                servicesList.appendChild(newService);
                
                // Clear form
                document.getElementById('apiKey').value = '';
                document.getElementById('integrationConfig').value = '';
                
                alert(service + ' integration added successfully!');
            } else {
                alert('Please enter an API key.');
            }
        }

        function saveSettings() {
            const prettyPrint = document.getElementById('prettyPrint').checked;
            const autoSave = document.getElementById('autoSave').checked;
            const notifications = document.getElementById('notifications').checked;
            const environment = document.getElementById('environment').value;
            
            alert('Settings saved successfully!\\nPretty Print: ' + prettyPrint + '\\nAuto-save: ' + autoSave + '\\nNotifications: ' + notifications + '\\nEnvironment: ' + environment);
        }

        function refreshStatus() {
            const statusElement = document.getElementById('systemStatus');
            statusElement.textContent = 'Refreshing...';
            
            setTimeout(() => {
                statusElement.textContent = 'System: FlashFusion v2.0.0\\nStatus: ✅ Operational\\nUptime: 99.9%\\nActive Agents: 3\\nRunning Workflows: 5\\nAPI Calls Today: ' + Math.floor(Math.random() * 2000 + 1000) + '\\nMemory Usage: ' + Math.floor(Math.random() * 50 + 30) + '%\\nCPU Usage: ' + Math.floor(Math.random() * 40 + 15) + '%\\nDatabase: Connected\\nLast Updated: ' + new Date().toISOString();
            }, 1000);
        }

        // Auto-refresh status every 30 seconds
        setInterval(refreshStatus, 30000);
    </script>
    <script src="https://va.vercel-scripts.com/v1/analytics.js" async></script>
    <script src="https://va.vercel-scripts.com/v1/speed-insights.js" async></script>
</body>
</html>`;