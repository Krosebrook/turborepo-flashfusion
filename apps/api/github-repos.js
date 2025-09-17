/**
 * GitHub Repository Discovery API Handler
 * Provides repository listing and metadata for the Krosebrook organization
 */

const {
  createGitHubClient,
} = require('../../../packages/shared/utils/githubApi');

module.exports = async (req, res) => {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    );

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'GET') {
      return res.status(405).json({
        error: 'Method not allowed',
        message: 'Only GET requests are supported',
      });
    }

    // Get GitHub token from environment
    const githubToken = process.env.GITHUB_TOKEN;

    if (!githubToken) {
      console.warn(
        'GitHub token not configured, using unauthenticated requests (limited rate)'
      );
    }

    // Create GitHub client
    const github = createGitHubClient(githubToken);

    // Parse query parameters
    const url = new URL(req.url, `http://${req.headers.host}`);
    const owner = url.searchParams.get('owner') || 'Krosebrook';
    const sort = url.searchParams.get('sort') || 'updated';
    const direction = url.searchParams.get('direction') || 'desc';

    console.log('Repository discovery request:', {
      owner,
      sort,
      direction,
      timestamp: new Date().toISOString(),
    });

    // Discover repositories
    const result = await github.discoverKrosebrookRepositories({
      sort,
      direction,
    });

    // Return the result
    return res.status(200).json(result);
  } catch (error) {
    console.error('GitHub repository discovery error:', error);
    return res.status(500).json({
      success: false,
      error: 'Repository discovery failed',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};
