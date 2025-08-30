/**
 * Stripe Webhook Handler for FlashFusion
 * Handles payment events, subscriptions, and billing
 */

module.exports = async (req, res) => {
    try {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Stripe-Signature');

        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const signature = req.headers['stripe-signature'];
        const rawBody = JSON.stringify(req.body);
        
        // Log webhook received
        console.log('Stripe webhook received:', {
            event_type: req.body?.type,
            timestamp: new Date().toISOString(),
            signature: signature ? 'present' : 'missing'
        });

        const event = req.body;

        // Handle different Stripe events
        switch (event.type) {
            case 'customer.subscription.created':
                await handleSubscriptionCreated(event.data.object);
                break;
            
            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object);
                break;
            
            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object);
                break;
            
            case 'invoice.payment_succeeded':
                await handlePaymentSucceeded(event.data.object);
                break;
            
            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;
            
            case 'customer.created':
                await handleCustomerCreated(event.data.object);
                break;
            
            case 'payment_intent.succeeded':
                await handlePaymentIntentSucceeded(event.data.object);
                break;
            
            default:
                console.log('Unhandled Stripe event type:', event.type);
        }

        return res.status(200).json({ 
            received: true, 
            event_type: event.type,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Stripe webhook error:', error);
        return res.status(400).json({ 
            error: 'Webhook processing failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

// Stripe event handlers
async function handleSubscriptionCreated(subscription) {
    console.log('New subscription created:', {
        id: subscription.id,
        customer: subscription.customer,
        status: subscription.status,
        plan: subscription.items.data[0]?.price?.nickname
    });
    
    // TODO: Update user record in database
    // TODO: Send welcome email
    // TODO: Activate premium features
}

async function handleSubscriptionUpdated(subscription) {
    console.log('Subscription updated:', {
        id: subscription.id,
        status: subscription.status,
        current_period_end: subscription.current_period_end
    });
    
    // TODO: Update user subscription status
    // TODO: Handle plan changes
}

async function handleSubscriptionDeleted(subscription) {
    console.log('Subscription cancelled:', {
        id: subscription.id,
        customer: subscription.customer
    });
    
    // TODO: Downgrade user to free plan
    // TODO: Send cancellation email
}

async function handlePaymentSucceeded(invoice) {
    console.log('Payment succeeded:', {
        id: invoice.id,
        amount: invoice.amount_paid,
        customer: invoice.customer
    });
    
    // TODO: Update payment records
    // TODO: Send receipt email
}

async function handlePaymentFailed(invoice) {
    console.log('Payment failed:', {
        id: invoice.id,
        customer: invoice.customer,
        amount: invoice.amount_due
    });
    
    // TODO: Handle failed payment
    // TODO: Send payment retry email
}

async function handleCustomerCreated(customer) {
    console.log('New customer created:', {
        id: customer.id,
        email: customer.email,
        name: customer.name
    });
    
    // TODO: Create user profile
    // TODO: Send onboarding email
}

async function handlePaymentIntentSucceeded(paymentIntent) {
    console.log('Payment intent succeeded:', {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
    });
    
    // TODO: Process one-time payment
    // TODO: Unlock purchased features
}