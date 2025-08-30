const { MongoClient, ServerApiVersion } = require('mongodb');

class MongoService {
  constructor() {
    this.uri = process.env.MONGODB_URI || "mongodb+srv://kylerosebrook:<db_password>@cluster0.j8rktan.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
    this.client = null;
    this.db = null;
  }

  async connect() {
    try {
      if (this.client) {
        return this.client;
      }

      this.client = new MongoClient(this.uri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        }
      });

      await this.client.connect();
      
      // Default to flashfusion database
      this.db = this.client.db(process.env.MONGODB_DB_NAME || 'flashfusion');
      
      console.log("Successfully connected to MongoDB!");
      return this.client;
    } catch (error) {
      console.error("MongoDB connection error:", error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      console.log("Disconnected from MongoDB");
    }
  }

  async ping() {
    try {
      await this.client.db("admin").command({ ping: 1 });
      console.log("MongoDB ping successful!");
      return true;
    } catch (error) {
      console.error("MongoDB ping failed:", error);
      return false;
    }
  }

  getDatabase(dbName = null) {
    if (!this.client) {
      throw new Error("MongoDB client not connected. Call connect() first.");
    }
    return dbName ? this.client.db(dbName) : this.db;
  }

  getCollection(collectionName, dbName = null) {
    const database = this.getDatabase(dbName);
    return database.collection(collectionName);
  }

  // Conversation operations
  async getConversations(userId, limit = 50, skip = 0) {
    const collection = this.getCollection('conversations');
    return await collection
      .find({ participants: userId })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip(skip)
      .toArray();
  }

  async createConversation(conversationData) {
    const collection = this.getCollection('conversations');
    const conversation = {
      ...conversationData,
      createdAt: new Date(),
      updatedAt: new Date(),
      participants: conversationData.participants || [],
      messages: []
    };
    
    const result = await collection.insertOne(conversation);
    return { ...conversation, _id: result.insertedId };
  }

  async updateConversation(conversationId, updateData) {
    const collection = this.getCollection('conversations');
    const result = await collection.updateOne(
      { _id: conversationId },
      { 
        $set: { 
          ...updateData, 
          updatedAt: new Date() 
        } 
      }
    );
    return result;
  }

  async deleteConversation(conversationId) {
    const collection = this.getCollection('conversations');
    return await collection.deleteOne({ _id: conversationId });
  }

  async addParticipant(conversationId, userId) {
    const collection = this.getCollection('conversations');
    return await collection.updateOne(
      { _id: conversationId },
      { 
        $addToSet: { participants: userId },
        $set: { updatedAt: new Date() }
      }
    );
  }

  async removeParticipant(conversationId, userId) {
    const collection = this.getCollection('conversations');
    return await collection.updateOne(
      { _id: conversationId },
      { 
        $pull: { participants: userId },
        $set: { updatedAt: new Date() }
      }
    );
  }

  // Message operations
  async addMessage(conversationId, messageData) {
    const collection = this.getCollection('conversations');
    const message = {
      ...messageData,
      _id: new Date().getTime().toString(),
      createdAt: new Date()
    };

    const result = await collection.updateOne(
      { _id: conversationId },
      { 
        $push: { messages: message },
        $set: { updatedAt: new Date() }
      }
    );

    return { ...message, conversationId };
  }

  async getMessages(conversationId, limit = 100, skip = 0) {
    const collection = this.getCollection('conversations');
    const conversation = await collection.findOne(
      { _id: conversationId },
      { 
        projection: { 
          messages: { 
            $slice: [skip, limit] 
          } 
        } 
      }
    );
    
    return conversation?.messages || [];
  }

  // User operations
  async createUser(userData) {
    const collection = this.getCollection('users');
    const user = {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await collection.insertOne(user);
    return { ...user, _id: result.insertedId };
  }

  async getUser(userId) {
    const collection = this.getCollection('users');
    return await collection.findOne({ _id: userId });
  }

  async updateUser(userId, updateData) {
    const collection = this.getCollection('users');
    return await collection.updateOne(
      { _id: userId },
      { 
        $set: { 
          ...updateData, 
          updatedAt: new Date() 
        } 
      }
    );
  }

  // Notion integration data
  async saveNotionData(userId, notionData) {
    const collection = this.getCollection('notion_data');
    const data = {
      userId,
      ...notionData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await collection.replaceOne(
      { userId },
      data,
      { upsert: true }
    );
    
    return { ...data, _id: result.insertedId || result.upsertedId };
  }

  async getNotionData(userId) {
    const collection = this.getCollection('notion_data');
    return await collection.findOne({ userId });
  }

  // Physics simulation data
  async savePhysicsState(sessionId, physicsData) {
    const collection = this.getCollection('physics_sessions');
    const data = {
      sessionId,
      ...physicsData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await collection.replaceOne(
      { sessionId },
      data,
      { upsert: true }
    );
    
    return { ...data, _id: result.insertedId || result.upsertedId };
  }

  async getPhysicsState(sessionId) {
    const collection = this.getCollection('physics_sessions');
    return await collection.findOne({ sessionId });
  }

  // Analytics and usage tracking
  async trackEvent(eventData) {
    const collection = this.getCollection('analytics');
    const event = {
      ...eventData,
      timestamp: new Date()
    };
    
    const result = await collection.insertOne(event);
    return { ...event, _id: result.insertedId };
  }

  async getAnalytics(userId, startDate, endDate) {
    const collection = this.getCollection('analytics');
    const query = { userId };
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    return await collection.find(query).sort({ timestamp: -1 }).toArray();
  }
}

// Create singleton instance
const mongoService = new MongoService();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await mongoService.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await mongoService.disconnect();
  process.exit(0);
});

module.exports = mongoService;