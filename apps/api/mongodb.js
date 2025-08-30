const mongoService = require('../src/services/mongoService');

/**
 * MongoDB API endpoint for FlashFusion
 * Handles all MongoDB operations through the unified API
 */
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Ensure MongoDB connection
    await mongoService.connect();

    const { method, query, body } = req;
    const { action, collection, id } = query;

    switch (method) {
      case 'GET':
        await handleGet(req, res, action, collection, id);
        break;
      case 'POST':
        await handlePost(req, res, action, collection, body);
        break;
      case 'PUT':
        await handlePut(req, res, action, collection, id, body);
        break;
      case 'DELETE':
        await handleDelete(req, res, action, collection, id);
        break;
      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('MongoDB API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

async function handleGet(req, res, action, collection, id) {
  const { userId, limit = 50, skip = 0, startDate, endDate, sessionId } = req.query;

  switch (action) {
    case 'ping':
      const isConnected = await mongoService.ping();
      res.json({ connected: isConnected, timestamp: new Date().toISOString() });
      break;

    case 'conversations':
      if (id) {
        // Get specific conversation
        const conversation = await mongoService.getCollection('conversations').findOne({ _id: id });
        res.json(conversation);
      } else {
        // Get user's conversations
        const conversations = await mongoService.getConversations(userId, parseInt(limit), parseInt(skip));
        res.json(conversations);
      }
      break;

    case 'messages':
      if (!id) {
        return res.status(400).json({ error: 'Conversation ID required for messages' });
      }
      const messages = await mongoService.getMessages(id, parseInt(limit), parseInt(skip));
      res.json(messages);
      break;

    case 'user':
      if (!id) {
        return res.status(400).json({ error: 'User ID required' });
      }
      const user = await mongoService.getUser(id);
      res.json(user);
      break;

    case 'notion-data':
      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }
      const notionData = await mongoService.getNotionData(userId);
      res.json(notionData);
      break;

    case 'physics-state':
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID required' });
      }
      const physicsState = await mongoService.getPhysicsState(sessionId);
      res.json(physicsState);
      break;

    case 'analytics':
      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }
      const analytics = await mongoService.getAnalytics(userId, startDate, endDate);
      res.json(analytics);
      break;

    case 'collection':
      if (!collection) {
        return res.status(400).json({ error: 'Collection name required' });
      }
      const collectionData = await mongoService.getCollection(collection)
        .find({})
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .toArray();
      res.json(collectionData);
      break;

    default:
      res.status(400).json({ error: 'Invalid action for GET request' });
  }
}

async function handlePost(req, res, action, collection, body) {
  switch (action) {
    case 'conversation':
      const conversation = await mongoService.createConversation(body);
      res.status(201).json(conversation);
      break;

    case 'message':
      const { conversationId, ...messageData } = body;
      if (!conversationId) {
        return res.status(400).json({ error: 'Conversation ID required' });
      }
      const message = await mongoService.addMessage(conversationId, messageData);
      res.status(201).json(message);
      break;

    case 'user':
      const user = await mongoService.createUser(body);
      res.status(201).json(user);
      break;

    case 'notion-data':
      const { userId, ...notionData } = body;
      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }
      const savedNotionData = await mongoService.saveNotionData(userId, notionData);
      res.status(201).json(savedNotionData);
      break;

    case 'physics-state':
      const { sessionId, ...physicsData } = body;
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID required' });
      }
      const savedPhysicsState = await mongoService.savePhysicsState(sessionId, physicsData);
      res.status(201).json(savedPhysicsState);
      break;

    case 'track-event':
      const event = await mongoService.trackEvent(body);
      res.status(201).json(event);
      break;

    case 'add-participant':
      const { conversationId: convId, userId: participantId } = body;
      if (!convId || !participantId) {
        return res.status(400).json({ error: 'Conversation ID and User ID required' });
      }
      const addResult = await mongoService.addParticipant(convId, participantId);
      res.json(addResult);
      break;

    default:
      res.status(400).json({ error: 'Invalid action for POST request' });
  }
}

async function handlePut(req, res, action, collection, id, body) {
  if (!id) {
    return res.status(400).json({ error: 'ID required for PUT request' });
  }

  switch (action) {
    case 'conversation':
      const updatedConversation = await mongoService.updateConversation(id, body);
      res.json(updatedConversation);
      break;

    case 'user':
      const updatedUser = await mongoService.updateUser(id, body);
      res.json(updatedUser);
      break;

    default:
      res.status(400).json({ error: 'Invalid action for PUT request' });
  }
}

async function handleDelete(req, res, action, collection, id) {
  if (!id) {
    return res.status(400).json({ error: 'ID required for DELETE request' });
  }

  switch (action) {
    case 'conversation':
      const deleteResult = await mongoService.deleteConversation(id);
      res.json(deleteResult);
      break;

    case 'remove-participant':
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ error: 'User ID required to remove participant' });
      }
      const removeResult = await mongoService.removeParticipant(id, userId);
      res.json(removeResult);
      break;

    default:
      res.status(400).json({ error: 'Invalid action for DELETE request' });
  }
}