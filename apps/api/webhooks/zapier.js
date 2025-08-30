/**
 * Zapier Webhook Handler for FlashFusion
 * Handles automation triggers and actions from Zapier
 */

module.exports = async (req, res) => {
    try {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Zapier-Source, Authorization');

        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        const zapierSource = req.headers['x-zapier-source'];
        const authorization = req.headers['authorization'];
        
        console.log('Zapier webhook received:', {
            method: req.method,
            source: zapierSource,
            has_auth: !!authorization,
            timestamp: new Date().toISOString()
        });

        // Handle GET requests (Zapier polling)
        if (req.method === 'GET') {
            return handleZapierPolling(req, res);
        }

        // Handle POST requests (Zapier actions)
        if (req.method === 'POST') {
            return handleZapierAction(req, res);
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Zapier webhook error:', error);
        return res.status(400).json({ 
            error: 'Webhook processing failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

// Handle Zapier polling triggers
async function handleZapierPolling(req, res) {
    const { trigger_type, limit = 10 } = req.query;
    
    console.log('Zapier polling request:', { trigger_type, limit });

    try {
        let data = [];

        switch (trigger_type) {
            case 'new_lead':
                data = await getNewLeads(limit);
                break;
            
            case 'new_customer':
                data = await getNewCustomers(limit);
                break;
            
            case 'new_order':
                data = await getNewOrders(limit);
                break;
            
            case 'workflow_completed':
                data = await getCompletedWorkflows(limit);
                break;
            
            case 'agent_response':
                data = await getAgentResponses(limit);
                break;
            
            default:
                return res.status(400).json({ error: 'Unknown trigger type' });
        }

        return res.status(200).json(data);

    } catch (error) {
        console.error('Zapier polling error:', error);
        return res.status(500).json({ 
            error: 'Polling failed',
            message: error.message 
        });
    }
}

// Handle Zapier actions
async function handleZapierAction(req, res) {
    const data = req.body;
    const { action_type } = data;
    
    console.log('Zapier action received:', { action_type, data });

    try {
        let result;

        switch (action_type) {
            case 'create_lead':
                result = await createLead(data);
                break;
            
            case 'send_email':
                result = await sendEmail(data);
                break;
            
            case 'create_task':
                result = await createTask(data);
                break;
            
            case 'update_customer':
                result = await updateCustomer(data);
                break;
            
            case 'trigger_workflow':
                result = await triggerWorkflow(data);
                break;
            
            case 'create_agent':
                result = await createAgent(data);
                break;
            
            default:
                return res.status(400).json({ error: 'Unknown action type' });
        }

        return res.status(200).json({
            success: true,
            result,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Zapier action error:', error);
        return res.status(500).json({ 
            error: 'Action failed',
            message: error.message 
        });
    }
}

// Polling data functions
async function getNewLeads(limit) {
    // TODO: Connect to database and fetch new leads
    return [
        {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            source: 'website',
            created_at: new Date().toISOString()
        }
    ].slice(0, limit);
}

async function getNewCustomers(limit) {
    // TODO: Connect to database and fetch new customers
    return [
        {
            id: '1',
            name: 'Jane Smith',
            email: 'jane@example.com',
            status: 'active',
            created_at: new Date().toISOString()
        }
    ].slice(0, limit);
}

async function getNewOrders(limit) {
    // TODO: Connect to database and fetch new orders
    return [
        {
            id: '1',
            customer_email: 'customer@example.com',
            total: 99.99,
            status: 'paid',
            created_at: new Date().toISOString()
        }
    ].slice(0, limit);
}

async function getCompletedWorkflows(limit) {
    // TODO: Connect to database and fetch completed workflows
    return [
        {
            id: '1',
            name: 'Lead Nurturing Sequence',
            status: 'completed',
            completed_at: new Date().toISOString()
        }
    ].slice(0, limit);
}

async function getAgentResponses(limit) {
    // TODO: Connect to database and fetch agent responses
    return [
        {
            id: '1',
            agent_name: 'Sales Bot',
            customer_email: 'customer@example.com',
            response: 'Thank you for your inquiry!',
            created_at: new Date().toISOString()
        }
    ].slice(0, limit);
}

// Action functions
async function createLead(data) {
    console.log('Creating lead:', data);
    // TODO: Create lead in database
    return {
        id: Date.now().toString(),
        name: data.name,
        email: data.email,
        source: data.source || 'zapier',
        created_at: new Date().toISOString()
    };
}

async function sendEmail(data) {
    console.log('Sending email:', data);
    // TODO: Integrate with email service
    return {
        message_id: Date.now().toString(),
        to: data.to,
        subject: data.subject,
        sent_at: new Date().toISOString()
    };
}

async function createTask(data) {
    console.log('Creating task:', data);
    // TODO: Create task in task management system
    return {
        id: Date.now().toString(),
        title: data.title,
        description: data.description,
        assignee: data.assignee,
        created_at: new Date().toISOString()
    };
}

async function updateCustomer(data) {
    console.log('Updating customer:', data);
    // TODO: Update customer in database
    return {
        id: data.id,
        updated_fields: Object.keys(data).filter(key => key !== 'id'),
        updated_at: new Date().toISOString()
    };
}

async function triggerWorkflow(data) {
    console.log('Triggering workflow:', data);
    // TODO: Trigger workflow execution
    return {
        workflow_id: data.workflow_id,
        execution_id: Date.now().toString(),
        status: 'started',
        started_at: new Date().toISOString()
    };
}

async function createAgent(data) {
    console.log('Creating agent:', data);
    // TODO: Create AI agent
    return {
        id: Date.now().toString(),
        name: data.name,
        type: data.type,
        instructions: data.instructions,
        created_at: new Date().toISOString()
    };
}