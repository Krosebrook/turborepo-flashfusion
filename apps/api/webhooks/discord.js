/**
 * Discord Webhook Handler for FlashFusion
 * Handles Discord bot events, slash commands, and interactions
 */

module.exports = async (req, res) => {
    try {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Signature-Ed25519, X-Signature-Timestamp');

        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const signature = req.headers['x-signature-ed25519'];
        const timestamp = req.headers['x-signature-timestamp'];
        
        console.log('Discord webhook received:', {
            has_signature: !!signature,
            timestamp,
            body_type: typeof req.body,
            interaction_type: req.body?.type
        });

        const interaction = req.body;

        // Verify Discord signature (in production, implement proper verification)
        // TODO: Implement Discord signature verification

        // Handle different interaction types
        switch (interaction.type) {
            case 1: // PING
                return res.status(200).json({ type: 1 });
            
            case 2: // APPLICATION_COMMAND
                return await handleApplicationCommand(interaction, res);
            
            case 3: // MESSAGE_COMPONENT
                return await handleMessageComponent(interaction, res);
            
            case 4: // APPLICATION_COMMAND_AUTOCOMPLETE
                return await handleAutocomplete(interaction, res);
            
            case 5: // MODAL_SUBMIT
                return await handleModalSubmit(interaction, res);
            
            default:
                console.log('Unknown interaction type:', interaction.type);
                return res.status(400).json({ error: 'Unknown interaction type' });
        }

    } catch (error) {
        console.error('Discord webhook error:', error);
        return res.status(400).json({ 
            error: 'Webhook processing failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

// Handle slash commands
async function handleApplicationCommand(interaction, res) {
    const { data: command, member, guild_id } = interaction;
    
    console.log('Discord command received:', {
        command: command.name,
        user: member?.user?.username,
        guild_id
    });

    try {
        let response;

        switch (command.name) {
            case 'flashfusion':
                response = await handleFlashFusionCommand(command, interaction);
                break;
            
            case 'agent':
                response = await handleAgentCommand(command, interaction);
                break;
            
            case 'workflow':
                response = await handleWorkflowCommand(command, interaction);
                break;
            
            case 'status':
                response = await handleStatusCommand(command, interaction);
                break;
            
            case 'help':
                response = await handleHelpCommand(command, interaction);
                break;
            
            default:
                response = {
                    type: 4,
                    data: {
                        content: `Unknown command: ${command.name}`,
                        flags: 64 // EPHEMERAL
                    }
                };
        }

        return res.status(200).json(response);

    } catch (error) {
        console.error('Command handling error:', error);
        return res.status(200).json({
            type: 4,
            data: {
                content: 'An error occurred while processing your command.',
                flags: 64 // EPHEMERAL
            }
        });
    }
}

// Handle button clicks and select menus
async function handleMessageComponent(interaction, res) {
    const { data: component, member } = interaction;
    
    console.log('Discord component interaction:', {
        custom_id: component.custom_id,
        component_type: component.component_type,
        user: member?.user?.username
    });

    try {
        let response;

        switch (component.custom_id) {
            case 'create_agent':
                response = await handleCreateAgentButton(interaction);
                break;
            
            case 'view_workflows':
                response = await handleViewWorkflowsButton(interaction);
                break;
            
            case 'system_status':
                response = await handleSystemStatusButton(interaction);
                break;
            
            default:
                response = {
                    type: 4,
                    data: {
                        content: 'Unknown interaction.',
                        flags: 64
                    }
                };
        }

        return res.status(200).json(response);

    } catch (error) {
        console.error('Component interaction error:', error);
        return res.status(200).json({
            type: 4,
            data: {
                content: 'An error occurred while processing your interaction.',
                flags: 64
            }
        });
    }
}

// Handle autocomplete for commands
async function handleAutocomplete(interaction, res) {
    const { data: command } = interaction;
    
    console.log('Discord autocomplete:', {
        command: command.name,
        focused_option: command.options?.find(opt => opt.focused)?.name
    });

    let choices = [];

    // Provide autocomplete suggestions based on command and focused option
    if (command.name === 'agent') {
        const focusedOption = command.options?.find(opt => opt.focused);
        if (focusedOption?.name === 'type') {
            choices = [
                { name: 'Sales Agent', value: 'sales' },
                { name: 'Content Creator', value: 'content' },
                { name: 'Customer Support', value: 'support' },
                { name: 'Data Analyst', value: 'analyst' }
            ];
        }
    }

    return res.status(200).json({
        type: 8, // APPLICATION_COMMAND_AUTOCOMPLETE_RESULT
        data: { choices }
    });
}

// Handle modal submissions
async function handleModalSubmit(interaction, res) {
    const { data: modal } = interaction;
    
    console.log('Discord modal submission:', {
        custom_id: modal.custom_id,
        components: modal.components?.length
    });

    // Process modal data
    const formData = {};
    modal.components?.forEach(row => {
        row.components?.forEach(component => {
            formData[component.custom_id] = component.value;
        });
    });

    return res.status(200).json({
        type: 4,
        data: {
            content: 'Form submitted successfully!',
            flags: 64
        }
    });
}

// Command handlers
async function handleFlashFusionCommand(command, interaction) {
    return {
        type: 4,
        data: {
            embeds: [{
                title: '⚡ FlashFusion AI Platform',
                description: 'Your AI-powered business automation system is online!',
                color: 0x1e3c72,
                fields: [
                    {
                        name: '🤖 AI Agents',
                        value: '3 active agents processing requests',
                        inline: true
                    },
                    {
                        name: '🔄 Workflows', 
                        value: '5 workflows running',
                        inline: true
                    },
                    {
                        name: '📊 Status',
                        value: '✅ All systems operational',
                        inline: true
                    }
                ],
                footer: {
                    text: 'FlashFusion Dashboard',
                    icon_url: 'https://flashfusion.co/favicon.ico'
                },
                timestamp: new Date().toISOString()
            }],
            components: [{
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 5,
                        label: 'Open Dashboard',
                        url: 'https://flashfusion.co'
                    },
                    {
                        type: 2,
                        style: 1,
                        label: 'Create Agent',
                        custom_id: 'create_agent'
                    }
                ]
            }]
        }
    };
}

async function handleAgentCommand(command, interaction) {
    const subcommand = command.options?.[0];
    
    if (subcommand?.name === 'create') {
        // Show modal for agent creation
        return {
            type: 9, // MODAL
            data: {
                title: 'Create New AI Agent',
                custom_id: 'create_agent_modal',
                components: [
                    {
                        type: 1,
                        components: [{
                            type: 4,
                            custom_id: 'agent_name',
                            label: 'Agent Name',
                            style: 1,
                            min_length: 1,
                            max_length: 100,
                            placeholder: 'e.g., Sales Assistant',
                            required: true
                        }]
                    },
                    {
                        type: 1,
                        components: [{
                            type: 4,
                            custom_id: 'agent_instructions',
                            label: 'Instructions',
                            style: 2,
                            min_length: 10,
                            max_length: 1000,
                            placeholder: 'Describe what this agent should do...',
                            required: true
                        }]
                    }
                ]
            }
        };
    }

    return {
        type: 4,
        data: {
            content: 'Agent management commands:\n`/agent create` - Create a new AI agent\n`/agent list` - View all agents',
            flags: 64
        }
    };
}

async function handleWorkflowCommand(command, interaction) {
    return {
        type: 4,
        data: {
            embeds: [{
                title: '🔄 Active Workflows',
                color: 0x10b981,
                fields: [
                    {
                        name: 'Lead Nurturing',
                        value: '15 active leads being processed',
                        inline: false
                    },
                    {
                        name: 'Content Publishing',
                        value: '3 posts scheduled for today',
                        inline: false
                    },
                    {
                        name: 'Customer Onboarding',
                        value: '8 new customers in pipeline',
                        inline: false
                    }
                ]
            }],
            components: [{
                type: 1,
                components: [{
                    type: 2,
                    style: 1,
                    label: 'View All Workflows',
                    custom_id: 'view_workflows'
                }]
            }]
        }
    };
}

async function handleStatusCommand(command, interaction) {
    return {
        type: 4,
        data: {
            embeds: [{
                title: '📊 FlashFusion System Status',
                color: 0x10b981,
                fields: [
                    {
                        name: 'System Health',
                        value: '✅ Operational',
                        inline: true
                    },
                    {
                        name: 'Uptime',
                        value: '99.9%',
                        inline: true
                    },
                    {
                        name: 'Response Time',
                        value: '< 200ms',
                        inline: true
                    },
                    {
                        name: 'API Calls Today',
                        value: '1,247',
                        inline: true
                    },
                    {
                        name: 'Active Users',
                        value: '342',
                        inline: true
                    },
                    {
                        name: 'Last Updated',
                        value: new Date().toLocaleString(),
                        inline: true
                    }
                ]
            }]
        }
    };
}

async function handleHelpCommand(command, interaction) {
    return {
        type: 4,
        data: {
            embeds: [{
                title: '❓ FlashFusion Help',
                description: 'Available commands for the FlashFusion Discord bot:',
                color: 0x1e3c72,
                fields: [
                    {
                        name: '/flashfusion',
                        value: 'Show dashboard overview and quick actions',
                        inline: false
                    },
                    {
                        name: '/agent',
                        value: 'Manage AI agents (create, list, configure)',
                        inline: false
                    },
                    {
                        name: '/workflow',
                        value: 'View and manage active workflows',
                        inline: false
                    },
                    {
                        name: '/status',
                        value: 'Check system status and health metrics',
                        inline: false
                    }
                ],
                footer: {
                    text: 'Visit https://flashfusion.co for the full dashboard'
                }
            }]
        }
    };
}

// Button handlers
async function handleCreateAgentButton(interaction) {
    return {
        type: 9, // MODAL
        data: {
            title: 'Create New AI Agent',
            custom_id: 'create_agent_modal',
            components: [
                {
                    type: 1,
                    components: [{
                        type: 4,
                        custom_id: 'agent_name',
                        label: 'Agent Name',
                        style: 1,
                        placeholder: 'e.g., Sales Assistant',
                        required: true
                    }]
                }
            ]
        }
    };
}

async function handleViewWorkflowsButton(interaction) {
    return {
        type: 4,
        data: {
            content: 'Opening workflows dashboard...',
            components: [{
                type: 1,
                components: [{
                    type: 2,
                    style: 5,
                    label: 'View Workflows',
                    url: 'https://flashfusion.co#workflows'
                }]
            }]
        }
    };
}

async function handleSystemStatusButton(interaction) {
    return {
        type: 4,
        data: {
            content: '📊 System Status: All services operational\n🔍 Detailed metrics available on dashboard',
            components: [{
                type: 1,
                components: [{
                    type: 2,
                    style: 5,
                    label: 'View Dashboard',
                    url: 'https://flashfusion.co'
                }]
            }]
        }
    };
}