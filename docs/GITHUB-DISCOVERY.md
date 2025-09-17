# GitHub Repository Discovery Agent

This feature provides comprehensive repository discovery and analysis for the Krosebrook organization, helping identify which repositories should be imported into the `turborepo-flashfusion` monorepo.

## Features

### 🔍 Repository Discovery
- Lists all repositories under `github.com/Krosebrook`
- Fetches comprehensive metadata for each repository
- Supports both authenticated and unauthenticated requests
- Automatic fallback between different GitHub API endpoints

### 📊 Data Output
The agent returns JSON data with the following fields for each repository:
- `repo_name` - Repository name
- `description` - Repository description
- `primary_language` - Main programming language
- `last_commit_date` - Date of last commit/update
- `stars` - Number of stars
- `forks` - Number of forks
- `open_issues` - Number of open issues
- `size` - Repository size in KB
- `default_branch` - Default branch name
- `is_private` - Whether repository is private
- `html_url` - GitHub web URL
- `clone_url` - Git clone URL
- `created_at` - Repository creation date
- `updated_at` - Last update date
- `pushed_at` - Last push date

## Usage

### CLI Command
```bash
# Discover all Krosebrook repositories
npm run ff github:discover

# Or directly with node
node tools/cli/ff-cli.js github:discover
```

### API Endpoint
```bash
# Get repository data via API
GET /api/github/repositories?owner=Krosebrook&sort=updated&direction=desc

# Example with curl
curl "http://localhost:3001/api/github/repositories?owner=Krosebrook"
```

### Parameters
- `owner` - GitHub username/organization (default: Krosebrook)
- `sort` - Sort field: `updated`, `created`, `pushed`, `full_name` (default: updated)
- `direction` - Sort direction: `asc`, `desc` (default: desc)

## Configuration

### Environment Variables
Add to your `.env` file for better rate limits and private repository access:

```bash
# GitHub Personal Access Token (optional but recommended)
GITHUB_TOKEN=ghp_your_github_token_here
```

Without a token, the API uses unauthenticated requests with lower rate limits (60 requests/hour vs 5000 requests/hour).

### Creating a GitHub Token
1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Generate a new token with `repo` scope for private repositories
3. Add the token to your `.env` file as `GITHUB_TOKEN`

## Implementation Details

### Files Structure
```
packages/shared/utils/githubApi.js     # GitHub API client utility
apps/api/github-repos.js               # API endpoint handler
tools/cli/ff-cli.js                    # CLI command implementation
```

### Error Handling
The system includes comprehensive error handling:
- Automatic fallback from user API to organization API
- Fallback to search API if regular APIs fail
- Rate limit awareness and reporting
- Graceful degradation without authentication

### API Fallback Strategy
1. **Authenticated User/Org API** - Full access with high rate limits
2. **Unauthenticated User/Org API** - Limited access, lower rate limits
3. **Search API** - Public repositories only, basic rate limits
4. **Graceful failure** - Returns empty result set with error information

## Output Examples

### CLI Output
```
🔍 Discovering Krosebrook Repositories
✓ Found 19 repositories

📊 Repository Summary:
   Total repositories: 19
   Public repositories: 19
   Private repositories: 0
   Total stars: 170
   Total forks: 43
   Languages: TypeScript, JavaScript, Python, Java

✓ Repository data saved to: krosebrook-repositories-2025-01-17.json

🌟 Top Repositories by Stars:
   1. flashfusion-ide (25 ⭐) - TypeScript
   2. FlashFusion-Unified (18 ⭐) - JavaScript
   3. turborepo-flashfusion (15 ⭐) - JavaScript
   ...
```

### JSON Output
```json
{
  "success": true,
  "owner": "Krosebrook",
  "total_repositories": 19,
  "discovered_at": "2025-01-17T12:00:00.000Z",
  "repositories": [
    {
      "repo_name": "turborepo-flashfusion",
      "description": "Main monorepo with turborepo setup",
      "primary_language": "JavaScript",
      "last_commit_date": "2025-01-17T10:30:00Z",
      "stars": 15,
      "forks": 3,
      "open_issues": 2,
      "size": 1250,
      "default_branch": "main",
      "is_private": false,
      "html_url": "https://github.com/Krosebrook/turborepo-flashfusion",
      "clone_url": "https://github.com/Krosebrook/turborepo-flashfusion.git"
    }
  ],
  "summary": {
    "total_repos": 19,
    "languages": ["TypeScript", "JavaScript", "Python", "Java"],
    "total_stars": 170,
    "total_forks": 43,
    "private_repos": 0,
    "public_repos": 19
  }
}
```

## Integration Recommendations

Based on the repository analysis, the following repositories are recommended for integration into `turborepo-flashfusion`:

### High Priority (Core Platform)
1. **flashfusion-ide** - Production-ready IDE with Monaco editor
2. **FlashFusion-Unified** - Comprehensive backend with agent orchestration
3. **nextjs-with-supabase** - Production template for auth/database

### Medium Priority (Development Tools)
4. **theaidashboard** - AI management interface
5. **knowledge-base-app** - Knowledge management system
6. **enhanced-firecrawl-scraper** - Web scraping capabilities

### Low Priority (Specialized Tools)
7. **cortex-second-brain-4589** - Knowledge processing
8. **DevChat** - Communication platform
9. **d1-rest** - Database API utilities

## Testing

Test the implementation:

```bash
# Test CLI command
npm run ff github:discover

# Test API endpoint (requires dev server running)
node test-github-api.js

# Start development server first
cd apps/api && npm run dev
```

## Troubleshooting

### Common Issues

**Rate Limit Exceeded (403)**
- Add `GITHUB_TOKEN` to `.env` file
- Wait for rate limit reset (shown in error message)

**Repository Not Found (404)**
- Verify organization name spelling
- Check if repositories are private (requires authentication)

**Network/Connection Errors**
- Check internet connectivity
- Verify GitHub API is accessible
- Try using different network/VPN

### Debug Mode
Enable verbose logging by setting:
```bash
NODE_ENV=development
```

This will show detailed API request/response information for troubleshooting.