// backend/src/extensions/strapi-server.ts

module.exports = ({ strapi }: { strapi: any }) => {
  console.log('[Strapi Server] Initializing custom extensions...');
  
  // Register the policy globally
  try {
    const isOwnerPolicy = require('../policies/is-owner');
    strapi.policy('global::is-owner', isOwnerPolicy);
    console.log('[Strapi Server] ✓ Policy "global::is-owner" registered');
  } catch (err: any) {
    console.error('[Strapi Server] ✗ Failed to register policy:', err.message);
  }

  // Register JWT extractor middleware
  try {
    const jwtMiddleware = require('../middlewares/jwt-extractor');
    strapi.middleware('global::jwt-extractor', jwtMiddleware);
    console.log('[Strapi Server] ✓ Middleware "global::jwt-extractor" registered');
  } catch (err: any) {
    console.error('[Strapi Server] ✗ Failed to register middleware:', err.message);
  }

  // Add a debug endpoint for auth testing
  strapi.server.routes([
    {
      method: 'GET',
      path: '/api/debug/auth',
      handler: async (ctx: any) => {
        const userFromState = ctx.state?.user;
        const authHeader = ctx.headers?.authorization || 'NONE';
        
        ctx.body = {
          message: 'Auth Debug Endpoint',
          timestamp: new Date().toISOString(),
          headers: {
            authorization: authHeader,
            allHeaders: Object.keys(ctx.headers || {}),
          },
          state: {
            user: userFromState ? {
              id: userFromState.id,
              username: userFromState.username,
              email: userFromState.email
            } : null
          }
        };
      }
    }
  ]);

  console.log('[Strapi Server] ✓ Debug endpoint /api/debug/auth registered');
  console.log('[Strapi Server] ✓ All extensions loaded successfully');
};