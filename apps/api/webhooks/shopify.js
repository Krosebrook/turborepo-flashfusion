/**
 * Shopify Webhook Handler for FlashFusion
 * Handles orders, customers, products, and inventory
 */

module.exports = async (req, res) => {
    try {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Shopify-Topic, X-Shopify-Shop-Domain, X-Shopify-Webhook-Id');

        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const topic = req.headers['x-shopify-topic'];
        const shop = req.headers['x-shopify-shop-domain'];
        const webhookId = req.headers['x-shopify-webhook-id'];
        
        console.log('Shopify webhook received:', {
            topic,
            shop,
            webhook_id: webhookId,
            timestamp: new Date().toISOString()
        });

        const data = req.body;

        // Handle different Shopify webhook topics
        switch (topic) {
            case 'orders/create':
                await handleOrderCreated(data, shop);
                break;
            
            case 'orders/updated':
                await handleOrderUpdated(data, shop);
                break;
            
            case 'orders/paid':
                await handleOrderPaid(data, shop);
                break;
            
            case 'orders/cancelled':
                await handleOrderCancelled(data, shop);
                break;
            
            case 'orders/fulfilled':
                await handleOrderFulfilled(data, shop);
                break;
            
            case 'customers/create':
                await handleCustomerCreated(data, shop);
                break;
            
            case 'customers/update':
                await handleCustomerUpdated(data, shop);
                break;
            
            case 'products/create':
                await handleProductCreated(data, shop);
                break;
            
            case 'products/update':
                await handleProductUpdated(data, shop);
                break;
            
            case 'inventory_levels/update':
                await handleInventoryUpdated(data, shop);
                break;
            
            case 'app/uninstalled':
                await handleAppUninstalled(data, shop);
                break;
            
            default:
                console.log('Unhandled Shopify webhook topic:', topic);
        }

        return res.status(200).json({ 
            received: true, 
            topic,
            shop,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Shopify webhook error:', error);
        return res.status(400).json({ 
            error: 'Webhook processing failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

// Shopify event handlers
async function handleOrderCreated(order, shop) {
    console.log('New order created:', {
        id: order.id,
        order_number: order.order_number,
        total_price: order.total_price,
        customer_email: order.email,
        shop
    });
    
    // TODO: Process new order
    // TODO: Send order confirmation
    // TODO: Update inventory tracking
    // TODO: Trigger fulfillment workflows
}

async function handleOrderUpdated(order, shop) {
    console.log('Order updated:', {
        id: order.id,
        order_number: order.order_number,
        financial_status: order.financial_status,
        fulfillment_status: order.fulfillment_status,
        shop
    });
    
    // TODO: Update order in database
    // TODO: Handle status changes
}

async function handleOrderPaid(order, shop) {
    console.log('Order paid:', {
        id: order.id,
        order_number: order.order_number,
        total_price: order.total_price,
        shop
    });
    
    // TODO: Process payment confirmation
    // TODO: Trigger fulfillment
    // TODO: Update customer lifetime value
}

async function handleOrderCancelled(order, shop) {
    console.log('Order cancelled:', {
        id: order.id,
        order_number: order.order_number,
        cancel_reason: order.cancel_reason,
        shop
    });
    
    // TODO: Process cancellation
    // TODO: Handle refunds
    // TODO: Update inventory
}

async function handleOrderFulfilled(order, shop) {
    console.log('Order fulfilled:', {
        id: order.id,
        order_number: order.order_number,
        tracking_number: order.fulfillments?.[0]?.tracking_number,
        shop
    });
    
    // TODO: Send shipping notification
    // TODO: Update order status
    // TODO: Trigger post-purchase workflows
}

async function handleCustomerCreated(customer, shop) {
    console.log('New customer created:', {
        id: customer.id,
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
        shop
    });
    
    // TODO: Create customer profile
    // TODO: Add to email marketing
    // TODO: Trigger welcome sequence
}

async function handleCustomerUpdated(customer, shop) {
    console.log('Customer updated:', {
        id: customer.id,
        email: customer.email,
        total_spent: customer.total_spent,
        shop
    });
    
    // TODO: Update customer data
    // TODO: Trigger segmentation updates
}

async function handleProductCreated(product, shop) {
    console.log('New product created:', {
        id: product.id,
        title: product.title,
        handle: product.handle,
        product_type: product.product_type,
        shop
    });
    
    // TODO: Sync product data
    // TODO: Trigger marketing automation
    // TODO: Update catalog
}

async function handleProductUpdated(product, shop) {
    console.log('Product updated:', {
        id: product.id,
        title: product.title,
        updated_at: product.updated_at,
        shop
    });
    
    // TODO: Update product in database
    // TODO: Sync price changes
}

async function handleInventoryUpdated(inventoryLevel, shop) {
    console.log('Inventory updated:', {
        inventory_item_id: inventoryLevel.inventory_item_id,
        available: inventoryLevel.available,
        location_id: inventoryLevel.location_id,
        shop
    });
    
    // TODO: Update inventory tracking
    // TODO: Trigger low stock alerts
    // TODO: Update product availability
}

async function handleAppUninstalled(data, shop) {
    console.log('App uninstalled:', { shop });
    
    // TODO: Clean up app data
    // TODO: Cancel webhooks
    // TODO: Archive shop data
}