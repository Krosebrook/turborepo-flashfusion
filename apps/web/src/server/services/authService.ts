// server/services/authService.ts
// Emergency Authentication Service with Refresh Token Support

import { SecureApiKeyService } from './apiKeyService';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface User {
  id: string;
  email: string;
  role: string;
}

export class AuthService {
    private static readonly ACCESS_TOKEN_EXPIRY = 15 * 60 * 1000; // 15 minutes
    private static readonly REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

    /**
   * Refresh authentication token
   */
    static async refreshAuthToken(
        refreshToken: string
    ): Promise<AuthTokens | null> {
        try {
            // Validate refresh token
            if (!refreshToken) {
                throw new Error('No refresh token provided');
            }

            // In production, verify the refresh token against your database
            const isValidRefreshToken = await this.validateRefreshToken(refreshToken);

            if (!isValidRefreshToken) {
                return null;
            }

            // Generate new tokens
            const newTokens = await this.generateTokens();

            // Store new refresh token in database (implementation depends on your DB)
            await this.storeRefreshToken(newTokens.refreshToken);

            return newTokens;
        } catch (error) {
            console.error('Token refresh failed:', error);
            return null;
        }
    }

    /**
   * Client-side refresh token handler
   */
    static getClientRefreshHandler() {
        return `
const refreshAuthToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');
    
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 
        'Authorization': \`Bearer \${refreshToken}\`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      localStorage.clear();
      window.location.href = '/login';
      return null;
    }
    
    const { accessToken, refreshToken: newRefresh } = await response.json();
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', newRefresh);
    return accessToken;
  } catch (error) {
    localStorage.clear();
    window.location.href = '/login';
    return null;
  }
};

// Auto-refresh before token expires
const setupTokenAutoRefresh = () => {
  const checkInterval = 5 * 60 * 1000; // Check every 5 minutes
  
  setInterval(async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;
    
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const expiresIn = payload.exp * 1000 - Date.now();
      
      // Refresh if less than 5 minutes remaining
      if (expiresIn < 5 * 60 * 1000) {
        await refreshAuthToken();
      }
    } catch (error) {
      console.error('Token check failed:', error);
    }
  }, checkInterval);
};

// Initialize on page load
setupTokenAutoRefresh();
`;
    }

    /**
   * Validate refresh token
   */
    private static async validateRefreshToken(token: string): Promise<boolean> {
        try {
            // In production, check against your database
            // For now, basic validation
            return token.length > 20 && token.startsWith('rf_');
        } catch (error) {
            return false;
        }
    }

    /**
   * Generate new token pair
   */
    private static async generateTokens(): Promise<AuthTokens> {
    // In production, use proper JWT library
        const timestamp = Date.now();
        const randomPart = Math.random().toString(36).substring(2);

        return {
            accessToken: `at_${timestamp}_${randomPart}`,
            refreshToken: `rf_${timestamp}_${randomPart}`,
            expiresIn: this.ACCESS_TOKEN_EXPIRY
        };
    }

    /**
   * Store refresh token in database
   */
    private static async storeRefreshToken(token: string): Promise<void> {
    // Implementation depends on your database
    // This is a placeholder
        console.log('Storing refresh token:', `${token.substring(0, 10)}...`);
    }

    /**
   * Express middleware for token refresh endpoint
   */
    static refreshTokenEndpoint() {
        return async (req: any, res: any) => {
            try {
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return res.status(401).json({ error: 'No refresh token provided' });
                }

                const refreshToken = authHeader.substring(7);
                const newTokens = await this.refreshAuthToken(refreshToken);

                if (!newTokens) {
                    return res.status(401).json({ error: 'Invalid refresh token' });
                }

                res.json(newTokens);
            } catch (error) {
                console.error('Refresh endpoint error:', error);
                res.status(500).json({ error: 'Token refresh failed' });
            }
        };
    }

    /**
   * Authentication middleware
   */
    static authMiddleware() {
        return async (req: any, res: any, next: any) => {
            try {
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return res.status(401).json({ error: 'No token provided' });
                }

                const token = authHeader.substring(7);

                // Validate access token
                if (!token.startsWith('at_')) {
                    return res.status(401).json({ error: 'Invalid token format' });
                }

                // In production, verify JWT signature and expiration
                // For now, basic validation
                req.user = { id: 'user123', email: 'user@example.com', role: 'user' };
                next();
            } catch (error) {
                return res.status(401).json({ error: 'Authentication failed' });
            }
        };
    }
}

export default AuthService;