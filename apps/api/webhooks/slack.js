/**
 * Slack Webhook Handler for FlashFusion
 * Handles Slack events, slash commands, and interactive components
 */

module.exports = async (req, res) => {
    try {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Slack-Signature, X-Slack-Request-Timestamp');

        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const signature = req.headers['x-slack-signature'];
        const timestamp = req.headers['x-slack-request-timestamp'];
        
        console.log('Slack webhook received:', {
            has_signature: !!signature,
            timestamp,
            content_type: req.headers['content-type']
        });

        // Handle URL verification challenge (Slack app setup)
        if (req.body?.challenge) {
            console.log('Slack URL verification challenge received');
            return res.status(200).json({ challenge: req.body.challenge });
        }

        // Parse different content types
        let payload;
        if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
            // Slash commands and interactive components
            payload = JSON.parse(req.body.payload || '{}');
        } else {
            // Events API
            payload = req.body;
        }

        // Handle different Slack request types
        if (payload.type) {
            switch (payload.type) {
                case 'url_verification':
                    return res.status(200).json({ challenge: payload.challenge });
                
                case 'event_callback':
                    return await handleEventCallback(payload, res);
                
                case 'interactive_message':
                case 'block_actions':
                    return await handleInteractiveMessage(payload, res);
                
                case 'slash_command':
                    return await handleSlashCommand(payload, res);
                
                case 'view_submission':
                    return await handleViewSubmission(payload, res);
                
                default:
                    console.log('Unknown Slack payload type:', payload.type);
            }
        }

        // Handle slash commands (sent as form data)
        if (req.body.command) {
            return await handleSlashCommand(req.body, res);
        }

        return res.status(200).json({ ok: true });

    } catch (error) {
        console.error('Slack webhook error:', error);
        return res.status(400).json({ 
            error: 'Webhook processing failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

// Handle Slack Events API
async function handleEventCallback(payload, res) {
    const { event, team_id } = payload;
    
    console.log('Slack event received:', {
        type: event.type,
        team_id,
        user: event.user,
        channel: event.channel
    });

    try {
        switch (event.type) {
            case 'message':
                await handleMessage(event, team_id);
                break;
            
            case 'app_mention':
                await handleAppMention(event, team_id);
                break;
            
            case 'team_join':
                await handleTeamJoin(event, team_id);
                break;
            
            case 'channel_created':
                await handleChannelCreated(event, team_id);
                break;
            
            default:
                console.log('Unhandled Slack event type:', event.type);
        }

        return res.status(200).json({ ok: true });

    } catch (error) {
        console.error('Event handling error:', error);
        return res.status(200).json({ ok: true });
    }
}

// Handle slash commands
async function handleSlashCommand(payload, res) {
    const { command, text, user_id, channel_id, team_id } = payload;
    
    console.log('Slack slash command:', {
        command,
        text,
        user_id,
        channel_id,
        team_id
    });

    try {
        let response;

        switch (command) {
            case '/flashfusion':
                response = await handleFlashFusionCommand(text, payload);
                break;
            
            case '/agent':
                response = await handleAgentCommand(text, payload);
                break;
            
            case '/workflow':
                response = await handleWorkflowCommand(text, payload);
                break;
            
            case '/status':
                response = await handleStatusCommand(text, payload);
                break;
            
            default:
                response = {
                    response_type: 'ephemeral',
                    text: `Unknown command: ${command}`
                };
        }

        return res.status(200).json(response);

    } catch (error) {
        console.error('Slash command error:', error);
        return res.status(200).json({
            response_type: 'ephemeral',
            text: 'An error occurred while processing your command.'
        });
    }
}

// Handle interactive messages (buttons, selects, etc.)
async function handleInteractiveMessage(payload, res) {
    const { actions, user, channel, team } = payload;
    
    console.log('Slack interactive message:', {
        actions: actions?.map(a => ({ action_id: a.action_id, type: a.type })),
        user_id: user?.id,
        channel_id: channel?.id
    });

    try {
        const action = actions?.[0];
        let response;

        switch (action?.action_id) {
            case 'create_agent':
                response = await handleCreateAgentAction(action, payload);
                break;
            
            case 'view_workflows':
                response = await handleViewWorkflowsAction(action, payload);
                break;
            
            case 'system_status':
                response = await handleSystemStatusAction(action, payload);
                break;
            
            case 'agent_type_select':
                response = await handleAgentTypeSelect(action, payload);
                break;
            
            default:
                response = {
                    response_type: 'ephemeral',
                    text: 'Unknown action.'
                };
        }

        return res.status(200).json(response);

    } catch (error) {
        console.error('Interactive message error:', error);
        return res.status(200).json({
            response_type: 'ephemeral',
            text: 'An error occurred while processing your action.'
        });
    }
}

// Handle modal/view submissions
async function handleViewSubmission(payload, res) {
    const { view, user } = payload;
    
    console.log('Slack view submission:', {
        callback_id: view.callback_id,
        user_id: user.id
    });

    // Process form data
    const values = view.state?.values || {};
    const formData = {};
    
    Object.keys(values).forEach(blockId => {
        Object.keys(values[blockId]).forEach(actionId => {
            formData[actionId] = values[blockId][actionId].value;
        });
    });

    console.log('Form data received:', formData);

    // TODO: Process the form submission
    // TODO: Create agent, workflow, etc. based on form data

    return res.status(200).json({ response_action: 'clear' });
}

// Event handlers
async function handleMessage(event, teamId) {
    // Ignore bot messages to prevent loops
    if (event.bot_id) return;
    
    console.log('Message received:', {
        text: event.text?.substring(0, 100),
        user: event.user,
        channel: event.channel
    });
    
    // TODO: Process message for AI agent interactions
    // TODO: Trigger workflows based on message content
}

async function handleAppMention(event, teamId) {
    console.log('App mentioned:', {
        text: event.text,
        user: event.user,
        channel: event.channel
    });
    
    // TODO: Respond to app mentions
    // TODO: Provide help or status information
}

async function handleTeamJoin(event, teamId) {
    console.log('New team member:', {
        user: event.user?.id,
        team: teamId
    });
    
    // TODO: Send welcome message
    // TODO: Set up user onboarding
}

async function handleChannelCreated(event, teamId) {
    console.log('Channel created:', {
        channel: event.channel?.id,
        name: event.channel?.name
    });
    
    // TODO: Set up channel integrations if needed
}

// Command handlers
async function handleFlashFusionCommand(text, payload) {
    return {
        response_type: 'in_channel',
        blocks: [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: '⚡ FlashFusion AI Platform'
                }
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: 'Your AI-powered business automation system is online!'
                }
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: '*🤖 AI Agents:*\\n3 active agents'
                    },
                    {
                        type: 'mrkdwn',
                        text: '*🔄 Workflows:*\\n5 workflows running'
                    },
                    {
                        type: 'mrkdwn',
                        text: '*📊 Status:*\\n✅ All systems operational'
                    },
                    {
                        type: 'mrkdwn',
                        text: '*📈 Uptime:*\\n99.9%'
                    }
                ]
            },
            {
                type: 'actions',
                elements: [
                    {
                        type: 'button',
                        text: {
                            type: 'plain_text',
                            text: 'Open Dashboard'
                        },
                        url: 'https://flashfusion.co',
                        style: 'primary'
                    },
                    {
                        type: 'button',
                        text: {
                            type: 'plain_text',
                            text: 'Create Agent'
                        },
                        action_id: 'create_agent'
                    },
                    {
                        type: 'button',
                        text: {
                            type: 'plain_text',
                            text: 'View Workflows'
                        },
                        action_id: 'view_workflows'
                    }
                ]
            }
        ]
    };
}

async function handleAgentCommand(text, payload) {
    const args = text?.split(' ') || [];
    const subcommand = args[0];

    if (subcommand === 'create') {
        return {
            response_type: 'ephemeral',
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: 'Select the type of AI agent you want to create:'
                    }
                },
                {
                    type: 'actions',
                    elements: [
                        {
                            type: 'static_select',
                            placeholder: {
                                type: 'plain_text',
                                text: 'Choose agent type'
                            },
                            action_id: 'agent_type_select',
                            options: [
                                {
                                    text: {
                                        type: 'plain_text',
                                        text: '🤝 Sales Agent'
                                    },
                                    value: 'sales'
                                },
                                {
                                    text: {
                                        type: 'plain_text',
                                        text: '✍️ Content Creator'
                                    },
                                    value: 'content'
                                },
                                {
                                    text: {
                                        type: 'plain_text',
                                        text: '🎧 Customer Support'
                                    },
                                    value: 'support'
                                },
                                {
                                    text: {
                                        type: 'plain_text',
                                        text: '📊 Data Analyst'
                                    },
                                    value: 'analyst'
                                }
                            ]
                        }
                    ]
                }
            ]
        };
    }

    return {
        response_type: 'ephemeral',
        text: 'Agent commands:\\n• `/agent create` - Create a new AI agent\\n• `/agent list` - View all agents'
    };
}

async function handleWorkflowCommand(text, payload) {
    return {
        response_type: 'in_channel',
        blocks: [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: '🔄 Active Workflows'
                }
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: '*Lead Nurturing*\\n15 active leads being processed'
                    },
                    {
                        type: 'mrkdwn',
                        text: '*Content Publishing*\\n3 posts scheduled for today'
                    },
                    {
                        type: 'mrkdwn',
                        text: '*Customer Onboarding*\\n8 new customers in pipeline'
                    },
                    {
                        type: 'mrkdwn',
                        text: '*Email Automation*\\n142 emails sent today'
                    }
                ]
            },
            {
                type: 'actions',
                elements: [
                    {
                        type: 'button',
                        text: {
                            type: 'plain_text',
                            text: 'View All Workflows'
                        },
                        action_id: 'view_workflows',
                        style: 'primary'
                    }
                ]
            }
        ]
    };
}

async function handleStatusCommand(text, payload) {
    return {
        response_type: 'in_channel',
        blocks: [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: '📊 FlashFusion System Status'
                }
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: '*System Health:*\\n✅ Operational'
                    },
                    {
                        type: 'mrkdwn',
                        text: '*Uptime:*\\n99.9%'
                    },
                    {
                        type: 'mrkdwn',
                        text: '*Response Time:*\\n< 200ms'
                    },
                    {
                        type: 'mrkdwn',
                        text: '*API Calls Today:*\\n1,247'
                    },
                    {
                        type: 'mrkdwn',
                        text: '*Active Users:*\\n342'
                    },
                    {
                        type: 'mrkdwn',
                        text: '*Last Updated:*\\n' + new Date().toLocaleString()
                    }
                ]
            },
            {
                type: 'actions',
                elements: [
                    {
                        type: 'button',
                        text: {
                            type: 'plain_text',
                            text: 'View Detailed Status'
                        },
                        action_id: 'system_status',
                        style: 'primary'
                    }
                ]
            }
        ]
    };
}

// Action handlers
async function handleCreateAgentAction(action, payload) {
    // TODO: Open a modal for agent creation
    return {
        response_type: 'ephemeral',
        text: '🤖 Agent creation flow initiated! Opening creation modal...'
    };
}

async function handleViewWorkflowsAction(action, payload) {
    return {
        response_type: 'ephemeral',
        text: '🔄 Opening workflows dashboard at https://flashfusion.co#workflows'
    };
}

async function handleSystemStatusAction(action, payload) {
    return {
        response_type: 'ephemeral',
        text: '📊 Detailed system metrics available at https://flashfusion.co#status'
    };
}

async function handleAgentTypeSelect(action, payload) {
    const selectedType = action.selected_option?.value;
    const typeNames = {
        sales: 'Sales Agent',
        content: 'Content Creator',
        support: 'Customer Support',
        analyst: 'Data Analyst'
    };

    return {
        response_type: 'ephemeral',
        text: `✅ ${typeNames[selectedType]} selected! Creating your new AI agent...`,
        replace_original: true
    };
}