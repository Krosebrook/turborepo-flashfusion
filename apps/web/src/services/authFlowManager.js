/**
 * FlashFusion Authentication Flow Manager
 * Handles secure token storage, rotation, and OAuth flows
 */

import { supabase, supabaseAdmin } from '../utils/supabase-security-fixes.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export class AuthFlowManager {
  constructor() {
    this.sessionTable = 'user_sessions';
    this.oauthTable = 'oauth_connections';
    this.tokenExpiry = 15 * 60 * 1000; // 15 minutes
    this.refreshExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days
  }

  /**
   * Create a new user session with secure token storage
   */
  async createSession(userId, ipAddress, userAgent, deviceFingerprint) {
    try {
      const sessionToken = this.generateSecureToken();
      const refreshToken = this.generateSecureToken(64);
      const expiresAt = new Date(Date.now() + this.tokenExpiry);
      const refreshExpiresAt = new Date(Date.now() + this.refreshExpiry);

      // Store session in database
      const { data, error } = await supabaseAdmin
        .from(this.sessionTable)
        .insert({
          user_id: userId,
          session_token: sessionToken,
          refresh_token: refreshToken,
          expires_at: expiresAt.toISOString(),
          ip_address: ipAddress,
          user_agent: userAgent,
          device_fingerprint: deviceFingerprint,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      return {
        sessionToken,
        refreshToken,
        expiresAt: expiresAt.getTime(),
        refreshExpiresAt: refreshExpiresAt.getTime(),
        sessionId: data.id
      };
    } catch (error) {
      console.error('Failed to create session:', error);
      throw new Error('Session creation failed');
    }
  }

  /**
   * Validate and refresh session token
   */
  async validateSession(sessionToken) {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.sessionTable)
        .select('*')
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        throw new Error('Invalid session token');
      }

      const now = new Date();
      const expiresAt = new Date(data.expires_at);

      if (expiresAt <= now) {
        // Mark session as inactive
        await this.invalidateSession(data.id);
        throw new Error('Session expired');
      }

      // Update last accessed time
      await supabaseAdmin
        .from(this.sessionTable)
        .update({ last_accessed: now.toISOString() })
        .eq('id', data.id);

      return {
        userId: data.user_id,
        sessionId: data.id,
        expiresAt: expiresAt.getTime()
      };
    } catch (error) {
      console.error('Session validation failed:', error);
      throw error;
    }
  }

  /**
   * Refresh session using refresh token
   */
  async refreshSession(refreshToken) {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.sessionTable)
        .select('*')
        .eq('refresh_token', refreshToken)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        throw new Error('Invalid refresh token');
      }

      // Generate new tokens
      const newSessionToken = this.generateSecureToken();
      const newRefreshToken = this.generateSecureToken(64);
      const newExpiresAt = new Date(Date.now() + this.tokenExpiry);

      // Update session with new tokens
      const { error: updateError } = await supabaseAdmin
        .from(this.sessionTable)
        .update({
          session_token: newSessionToken,
          refresh_token: newRefreshToken,
          expires_at: newExpiresAt.toISOString(),
          last_accessed: new Date().toISOString()
        })
        .eq('id', data.id);

      if (updateError) throw updateError;

      return {
        sessionToken: newSessionToken,
        refreshToken: newRefreshToken,
        expiresAt: newExpiresAt.getTime(),
        userId: data.user_id
      };
    } catch (error) {
      console.error('Session refresh failed:', error);
      throw error;
    }
  }

  /**
   * Invalidate session
   */
  async invalidateSession(sessionId) {
    try {
      await supabaseAdmin
        .from(this.sessionTable)
        .update({ is_active: false })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Failed to invalidate session:', error);
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions() {
    try {
      const { data, error } = await supabaseAdmin.rpc('cleanup_expired_sessions');
      
      if (error) throw error;
      
      console.log(`Cleaned up ${data} expired sessions`);
      return data;
    } catch (error) {
      console.error('Failed to cleanup sessions:', error);
      return 0;
    }
  }

  /**
   * Store OAuth connection
   */
  async storeOAuthConnection(userId, provider, providerData) {
    try {
      const {
        access_token,
        refresh_token,
        expires_in,
        scope,
        provider_user_id,
        ...additionalData
      } = providerData;

      const expiresAt = expires_in 
        ? new Date(Date.now() + (expires_in * 1000))
        : null;

      const { data, error } = await supabaseAdmin
        .from(this.oauthTable)
        .upsert({
          user_id: userId,
          provider: provider,
          provider_user_id: provider_user_id,
          access_token: access_token,
          refresh_token: refresh_token,
          token_expires_at: expiresAt?.toISOString(),
          scope: scope ? scope.split(' ') : [],
          provider_data: additionalData,
          is_active: true
        }, {
          onConflict: 'user_id,provider,provider_user_id'
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to store OAuth connection:', error);
      throw error;
    }
  }

  /**
   * Get OAuth connection for user and provider
   */
  async getOAuthConnection(userId, provider) {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.oauthTable)
        .select('*')
        .eq('user_id', userId)
        .eq('provider', provider)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to get OAuth connection:', error);
      return null;
    }
  }

  /**
   * Refresh OAuth token
   */
  async refreshOAuthToken(userId, provider, newTokenData) {
    try {
      const { access_token, refresh_token, expires_in } = newTokenData;
      
      const expiresAt = expires_in 
        ? new Date(Date.now() + (expires_in * 1000))
        : null;

      const result = await supabaseAdmin.rpc('rotate_oauth_token', {
        p_user_id: userId,
        p_provider: provider,
        p_new_access_token: access_token,
        p_new_refresh_token: refresh_token,
        p_expires_at: expiresAt?.toISOString()
      });

      return result.data;
    } catch (error) {
      console.error('Failed to refresh OAuth token:', error);
      throw error;
    }
  }

  /**
   * Revoke OAuth connection
   */
  async revokeOAuthConnection(userId, provider) {
    try {
      await supabaseAdmin
        .from(this.oauthTable)
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('provider', provider);

      return true;
    } catch (error) {
      console.error('Failed to revoke OAuth connection:', error);
      throw error;
    }
  }

  /**
   * Generate secure token
   */
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Create device fingerprint
   */
  createDeviceFingerprint(userAgent, ipAddress, additionalData = {}) {
    const fingerprint = {
      userAgent,
      ipAddress,
      timestamp: Date.now(),
      ...additionalData
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(fingerprint))
      .digest('hex');
  }

  /**
   * Get user's active sessions
   */
  async getUserSessions(userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_active_sessions')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to get user sessions:', error);
      return [];
    }
  }

  /**
   * Get user's OAuth providers
   */
  async getUserOAuthProviders(userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_oauth_providers')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to get OAuth providers:', error);
      return [];
    }
  }
}

/**
 * OAuth Provider Configurations
 */
export class OAuthProviderManager {
  constructor() {
    this.providers = {
      shopify: {
        authUrl: 'https://accounts.shopify.com/oauth/authorize',
        tokenUrl: 'https://accounts.shopify.com/oauth/token',
        scope: 'read_products,write_products,read_orders,write_orders',
        clientId: process.env.SHOPIFY_CLIENT_ID,
        clientSecret: process.env.SHOPIFY_CLIENT_SECRET
      },
      github: {
        authUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        scope: 'repo,user',
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET
      },
      google: {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scope: 'profile email',
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET
      }
    };
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthUrl(provider, redirectUri, state) {
    const config = this.providers[provider];
    if (!config) throw new Error(`Unknown provider: ${provider}`);

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      scope: config.scope,
      state: state,
      response_type: 'code'
    });

    return `${config.authUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(provider, code, redirectUri) {
    const config = this.providers[provider];
    if (!config) throw new Error(`Unknown provider: ${provider}`);

    try {
      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code: code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`OAuth token exchange failed for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Refresh OAuth token
   */
  async refreshToken(provider, refreshToken) {
    const config = this.providers[provider];
    if (!config) throw new Error(`Unknown provider: ${provider}`);

    try {
      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`OAuth token refresh failed for ${provider}:`, error);
      throw error;
    }
  }
}

// Export singleton instances
export const authFlowManager = new AuthFlowManager();
export const oauthProviderManager = new OAuthProviderManager();