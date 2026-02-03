/**
 * AWS Lambda Function to Trigger GitHub Actions Scraper
 * 
 * Deploy this to AWS Lambda and set up API Gateway to expose it.
 * 
 * Required Environment Variables:
 *   - GITHUB_TOKEN: Personal Access Token with 'repo' scope
 *   - GITHUB_OWNER: Repository owner (e.g., 'your-username')
 *   - GITHUB_REPO: Repository name (e.g., 'company-website')
 * 
 * Setup Instructions:
 * 1. Create a GitHub Personal Access Token:
 *    - Go to GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic)
 *    - Generate new token with 'repo' scope
 *    - Copy the token
 * 
 * 2. Create Lambda Function:
 *    - Runtime: Node.js 18.x or 20.x
 *    - Copy this code to index.mjs (rename handler to 'handler')
 *    - Set environment variables (GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO)
 *    - Set timeout to 30 seconds
 * 
 * 3. Create API Gateway:
 *    - Create HTTP API
 *    - Add POST route (e.g., /trigger-scrape)
 *    - Integrate with Lambda function
 *    - Enable CORS for your domain
 *    - Deploy and note the invoke URL
 * 
 * 4. Update app.js:
 *    - Set CONFIG.updateApiUrl to your API Gateway URL
 */

// For Lambda, use this as index.mjs:
export const handler = async (event) => {
  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*', // Replace with your domain in production
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO } = process.env;

  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Missing configuration' }),
    };
  }

  try {
    // Trigger GitHub Actions via repository_dispatch
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'GR-Events-Scraper-Trigger',
        },
        body: JSON.stringify({
          event_type: 'scrape-events',
          client_payload: {
            triggered_by: 'user-request',
            timestamp: new Date().toISOString(),
          },
        }),
      }
    );

    if (response.status === 204) {
      // Success - GitHub returns 204 No Content for dispatches
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Scraper triggered successfully. Events will update in a few minutes.',
        }),
      };
    } else {
      const errorText = await response.text();
      console.error('GitHub API error:', response.status, errorText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          success: false,
          error: `GitHub API returned ${response.status}`,
        }),
      };
    }
  } catch (error) {
    console.error('Error triggering scraper:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to trigger scraper',
      }),
    };
  }
};

// For local testing or non-Lambda environments:
// Uncomment below if running outside Lambda
/*
const main = async () => {
  process.env.GITHUB_TOKEN = 'your-token-here';
  process.env.GITHUB_OWNER = 'your-username';
  process.env.GITHUB_REPO = 'company-website';
  
  const result = await handler({ requestContext: { http: { method: 'POST' } } });
  console.log(result);
};
main();
*/
