/**
 * FlashFusion OAuth Handler for Multiple Providers
 * Dynamic OAuth flow handler for Shopify, GitHub, Google, etc.
 */

import { authFlowManager, oauthProviderManager } from '../../../src/services/authFlowManager.js';
import { SecurityHeaders, AuditLogger } from '../../../src/utils/supabase-security-fixes.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  // Apply security headers
  SecurityHeaders.applyHeaders(res);

  const { provider } = req.query;
  const { method } = req;

  try {
    // Validate provider
    const supportedProviders = ['shopify', 'github', 'google', 'etsy', 'tiktok'];
    if (!supportedProviders.includes(provider)) {
      return res.status(400).json({
        error: 'Unsupported OAuth provider',
        provider: provider
      });
    }

    if (method === 'GET') {
      return handleOAuthCallback(req, res, provider);
    } else if (method === 'POST') {
      return initiateOAuth(req, res, provider);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error(`OAuth error for ${provider}:`, error);
    
    await AuditLogger.logSecurityEvent(
      'oauth_error',
      req.user?.id || 'anonymous',
      'high',
      {
        provider,
        error: error.message,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    return res.status(500).json({
      error: 'OAuth authentication failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

/**
 * Initiate OAuth flow
 */
async function initiateOAuth(req, res, provider) {
  const { userId, redirectUrl } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  try {
    // Generate secure state parameter
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state in session or database for validation
    // You might want to store this temporarily in Redis or database
    const stateData = {
      userId,
      provider,
      redirectUrl: redirectUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
      timestamp: Date.now()
    };

    // For now, we'll encode it in the state (in production, store securely)
    const encodedState = Buffer.from(JSON.stringify(stateData)).toString('base64');

    // Get OAuth authorization URL
    const authUrl = oauthProviderManager.getAuthUrl(
      provider,
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/oauth/${provider}`,
      encodedState
    );

    // Log OAuth initiation
    await AuditLogger.logEvent(
      'oauth_initiated',
      userId,
      {
        provider,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    return res.json({
      authUrl,
      state: encodedState
    });

  } catch (error) {
    console.error(`Failed to initiate OAuth for ${provider}:`, error);
    throw error;
  }
}

/**
 * Handle OAuth callback
 */
async function handleOAuthCallback(req, res, provider) {
  const { code, state, error } = req.query;

  // Handle OAuth errors
  if (error) {
    console.error(`OAuth error from ${provider}:`, error);
    return res.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?error=oauth_${error}`);
  }

  if (!code || !state) {
    return res.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?error=oauth_missing_params`);
  }

  try {
    // Decode and validate state
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    
    // Validate state timestamp (should be recent)
    const stateAge = Date.now() - stateData.timestamp;
    if (stateAge > 10 * 60 * 1000) { // 10 minutes
      throw new Error('OAuth state expired');
    }

    if (stateData.provider !== provider) {
      throw new Error('OAuth state provider mismatch');
    }

    const { userId, redirectUrl } = stateData;

    // Exchange code for tokens
    const tokenData = await oauthProviderManager.exchangeCodeForTokens(
      provider,
      code,
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/oauth/${provider}`
    );

    // Get provider-specific user data
    const providerUserData = await getProviderUserData(provider, tokenData.access_token);

    // Store OAuth connection
    await authFlowManager.storeOAuthConnection(userId, provider, {
      ...tokenData,
      provider_user_id: providerUserData.id,
      ...providerUserData
    });

    // Log successful OAuth
    await AuditLogger.logEvent(
      'oauth_success',
      userId,
      {
        provider,
        provider_user_id: providerUserData.id,
        scope: tokenData.scope
      }
    );

    // Redirect to success page
    return res.redirect(`${redirectUrl}?oauth_success=${provider}`);

  } catch (error) {
    console.error(`OAuth callback error for ${provider}:`, error);
    
    await AuditLogger.logSecurityEvent(
      'oauth_callback_error',
      'unknown',
      'medium',
      {
        provider,
        error: error.message,
        code: code ? 'present' : 'missing',
        state: state ? 'present' : 'missing'
      }
    );

    return res.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?error=oauth_failed`);
  }
}

/**
 * Get user data from OAuth provider
 */
async function getProviderUserData(provider, accessToken) {
  const endpoints = {
    github: 'https://api.github.com/user',
    google: 'https://www.googleapis.com/oauth2/v2/userinfo',
    shopify: 'https://api.shopify.com/auth/shop',
    etsy: 'https://openapi.etsy.com/v3/application/users/me',
    tiktok: 'https://open-api.tiktok.com/oauth/userinfo/'
  };

  const endpoint = endpoints[provider];
  if (!endpoint) {
    throw new Error(`No user data endpoint for provider: ${provider}`);
  }

  try {
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'FlashFusion/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user data: ${response.statusText}`);
    }

    const userData = await response.json();
    
    // Normalize user data across providers
    return normalizeUserData(provider, userData);

  } catch (error) {
    console.error(`Failed to get user data from ${provider}:`, error);
    throw error;
  }
}

/**
 * Normalize user data across different providers
 */
function normalizeUserData(provider, rawData) {
  const normalizers = {
    github: (data) => ({
      id: data.id.toString(),
      username: data.login,
      name: data.name,
      email: data.email,
      avatar_url: data.avatar_url,
      profile_url: data.html_url
    }),
    google: (data) => ({
      id: data.id,
      username: data.email.split('@')[0],
      name: data.name,
      email: data.email,
      avatar_url: data.picture,
      profile_url: null
    }),
    shopify: (data) => ({
      id: data.shop?.id?.toString() || data.id?.toString(),
      username: data.shop?.domain || data.domain,
      name: data.shop?.name || data.name,
      email: data.shop?.email || data.email,
      avatar_url: null,
      profile_url: data.shop?.domain ? `https://${data.shop.domain}` : null
    }),
    etsy: (data) => ({
      id: data.user_id?.toString(),
      username: data.login_name,
      name: data.first_name && data.last_name ? `${data.first_name} ${data.last_name}` : data.login_name,
      email: data.primary_email,
      avatar_url: data.image_url_75x75,
      profile_url: null
    }),
    tiktok: (data) => ({
      id: data.data?.user?.open_id,
      username: data.data?.user?.username,
      name: data.data?.user?.display_name,
      email: null, // TikTok doesn't provide email in basic scope
      avatar_url: data.data?.user?.avatar_url,
      profile_url: null
    })
  };

  const normalizer = normalizers[provider];
  if (!normalizer) {
    return rawData;
  }

  return normalizer(rawData);
}