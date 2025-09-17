/**
 * GitHub API Utility for FlashFusion
 * Provides repository discovery and metadata fetching capabilities
 */

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * GitHub API client configuration
 */
class GitHubAPI {
  constructor(token) {
    this.token = token;
    this.headers = {
      Accept: 'application/vnd.github+json',
      Authorization: token ? `Bearer ${token}` : undefined,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'FlashFusion-TurboRepo/1.0.0',
    };

    // Remove undefined headers
    Object.keys(this.headers).forEach(key => {
      if (this.headers[key] === undefined) {
        delete this.headers[key];
      }
    });
  }

  /**
   * Make a GitHub API request
   * @param {string} endpoint - API endpoint (without base URL)
   * @param {object} options - Fetch options
   * @returns {Promise<object>} API response
   */
  async request(endpoint, options = {}) {
    const url = `${GITHUB_API_BASE}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: 'Unknown error' }));
        throw new Error(
          `GitHub API Error: ${response.status} - ${errorData.message || response.statusText}`
        );
      }

      const data = await response.json();

      // Return data with rate limit info
      return {
        data,
        rateLimit: {
          limit: parseInt(response.headers.get('x-ratelimit-limit') || '60'),
          remaining: parseInt(
            response.headers.get('x-ratelimit-remaining') || '60'
          ),
          resetTime: parseInt(response.headers.get('x-ratelimit-reset') || '0'),
        },
      };
    } catch (error) {
      console.error('GitHub API request failed:', error);
      throw error;
    }
  }

  /**
   * Get all repositories for a user/organization
   * @param {string} owner - GitHub username or organization name
   * @param {object} options - Query options
   * @returns {Promise<Array>} Array of repository objects
   */
  async getRepositories(owner, options = {}) {
    const {
      type = 'all', // all, owner, public, private, member
      sort = 'updated', // created, updated, pushed, full_name
      direction = 'desc', // asc, desc
      per_page = 100,
      page = 1,
    } = options;

    const queryParams = new URLSearchParams({
      type,
      sort,
      direction,
      per_page: per_page.toString(),
      page: page.toString(),
    });

    // Try user endpoint first
    let endpoint = `/users/${owner}/repos?${queryParams}`;

    try {
      const result = await this.request(endpoint);
      return result;
    } catch (error) {
      // If user endpoint fails, try organization endpoint
      if (error.message.includes('404') || error.message.includes('403')) {
        console.log('Trying organization endpoint...');
        endpoint = `/orgs/${owner}/repos?${queryParams}`;
        return await this.request(endpoint);
      }
      throw error;
    }
  }

  /**
   * Search for repositories using GitHub Search API (works without authentication)
   * @param {string} owner - GitHub username or organization name
   * @param {object} options - Query options
   * @returns {Promise<object>} Search results
   */
  async searchRepositories(owner, options = {}) {
    const {
      sort = 'updated',
      order = 'desc',
      per_page = 100,
      page = 1,
    } = options;

    const query = `user:${owner}`;
    const queryParams = new URLSearchParams({
      q: query,
      sort,
      order,
      per_page: per_page.toString(),
      page: page.toString(),
    });

    const endpoint = `/search/repositories?${queryParams}`;

    try {
      const result = await this.request(endpoint);
      return {
        data: result.data.items || [],
        total_count: result.data.total_count || 0,
        rateLimit: result.rateLimit,
      };
    } catch (error) {
      console.error('Search API failed:', error);
      throw error;
    }
  }

  /**
   * Get all repositories for a user/organization with pagination
   * @param {string} owner - GitHub username or organization name
   * @param {object} options - Query options
   * @returns {Promise<Array>} Array of all repository objects
   */
  async getAllRepositories(owner, options = {}) {
    const repositories = [];
    let page = 1;
    let hasMore = true;
    let useSearch = false;

    while (hasMore) {
      try {
        let result;

        if (useSearch || !this.token) {
          // Use search API if no token or regular API failed
          result = await this.searchRepositories(owner, { ...options, page });
          const repos = result.data;

          if (repos && repos.length > 0) {
            repositories.push(...repos);
            page++;

            // Search API uses different pagination logic
            if (
              repos.length < (options.per_page || 100) ||
              repositories.length >= result.total_count
            ) {
              hasMore = false;
            }
          } else {
            hasMore = false;
          }
        } else {
          // Use regular API with authentication
          result = await this.getRepositories(owner, { ...options, page });
          const repos = result.data;

          if (repos && repos.length > 0) {
            repositories.push(...repos);
            page++;

            // If we got less than per_page results, we're done
            if (repos.length < (options.per_page || 100)) {
              hasMore = false;
            }
          } else {
            hasMore = false;
          }
        }
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error);

        // If regular API fails and we haven't tried search API yet, try search API
        if (
          !useSearch &&
          (error.message.includes('403') || error.message.includes('401'))
        ) {
          console.log('Switching to search API...');
          useSearch = true;
          page = 1; // Reset page counter for search API
          continue;
        }

        hasMore = false;
      }
    }

    return repositories;
  }

  /**
   * Transform repository data to the required format
   * @param {Array} repositories - Array of GitHub repository objects
   * @returns {Array} Array of transformed repository objects
   */
  transformRepositories(repositories) {
    return repositories.map(repo => ({
      repo_name: repo.name,
      description: repo.description || '',
      primary_language: repo.language || 'Unknown',
      last_commit_date: repo.updated_at || repo.pushed_at || repo.created_at,
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      open_issues: repo.open_issues_count || 0,
      size: repo.size || 0,
      default_branch: repo.default_branch || 'main',
      is_private: repo.private || false,
      html_url: repo.html_url,
      clone_url: repo.clone_url,
      created_at: repo.created_at,
      updated_at: repo.updated_at,
      pushed_at: repo.pushed_at,
    }));
  }

  /**
   * Get repository discovery data for Krosebrook organization
   * @param {object} options - Query options
   * @returns {Promise<object>} Repository discovery data
   */
  async discoverKrosebrookRepositories(options = {}) {
    const owner = 'Krosebrook';

    try {
      console.log(`Discovering repositories for ${owner}...`);

      const repositories = await this.getAllRepositories(owner, {
        sort: 'updated',
        direction: 'desc',
        ...options,
      });

      const transformedRepos = this.transformRepositories(repositories);

      return {
        success: true,
        owner,
        total_repositories: transformedRepos.length,
        discovered_at: new Date().toISOString(),
        repositories: transformedRepos,
        summary: {
          total_repos: transformedRepos.length,
          languages: [
            ...new Set(transformedRepos.map(r => r.primary_language)),
          ].filter(l => l !== 'Unknown'),
          total_stars: transformedRepos.reduce((sum, r) => sum + r.stars, 0),
          total_forks: transformedRepos.reduce((sum, r) => sum + r.forks, 0),
          private_repos: transformedRepos.filter(r => r.is_private).length,
          public_repos: transformedRepos.filter(r => !r.is_private).length,
        },
      };
    } catch (error) {
      console.error('Repository discovery failed:', error);
      return {
        success: false,
        error: error.message,
        owner,
        discovered_at: new Date().toISOString(),
        repositories: [],
      };
    }
  }
}

/**
 * Create a GitHub API client instance
 * @param {string} token - GitHub personal access token
 * @returns {GitHubAPI} GitHub API client instance
 */
function createGitHubClient(token) {
  return new GitHubAPI(token);
}

module.exports = {
  GitHubAPI,
  createGitHubClient,
};
