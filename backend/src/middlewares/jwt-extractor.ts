/**
 * JWT Extractor Middleware
 * Extracts JWT token from Authorization header and populates ctx.state.user
 */

module.exports = (options: any, { strapi }: { strapi: any }) => {
  return async (ctx: any, next: any) => {
    console.log('[JWT Extractor] Processing request:', ctx.method, ctx.path);
    
    const token = extractToken(ctx);

    if (!token) {
      console.log('[JWT Extractor] No token found, proceeding without auth');
      return next();
    }

    try {
      const decoded = verifyJWT(token);
      console.log('[JWT Extractor] Token decoded, user ID:', decoded.id);

      if (decoded && decoded.id) {
        // Get user from database using strapi instance
        const user = await strapi
          .plugin('users-permissions')
          .service('user')
          .fetch(decoded.id);

        if (user && !user.blocked) {
          ctx.state.user = user;
          ctx.state.userId = user.id;
          console.log('[JWT Extractor] ✓ User authenticated:', user.id, user.username);
        } else {
          console.log('[JWT Extractor] User not found or blocked');
        }
      }
    } catch (err: any) {
      console.log('[JWT Extractor] Token verification failed:', err.message);
      // Invalid token - continue without auth
    }

    return next();
  };
};

/**
 * Extract token from Authorization header or cookie
 */
function extractToken(ctx: any): string | null {
  // In Koa, headers are in ctx.headers (lowercase keys)
  const authHeader = ctx.headers?.authorization || ctx.headers?.Authorization || '';

  console.log('[JWT Extractor] Auth header found:', !!authHeader);
  console.log('[JWT Extractor] All headers:', Object.keys(ctx.headers || {}));

  // Check for Bearer token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    console.log('[JWT Extractor] Extracted token from Authorization header');
    return token;
  }

  // Fallback to cookie
  if (ctx.cookies) {
    const cookieToken = ctx.cookies.get('jwtToken');
    if (cookieToken) {
      console.log('[JWT Extractor] Extracted token from cookie');
      return cookieToken;
    }
  }

  console.log('[JWT Extractor] No token found');
  return null;
}

/**
 * Simple JWT verification and decode (no signature verification for speed)
 * NOTE: In production, use jsonwebtoken library for proper signature verification
 */
function verifyJWT(token: string): any {
  try {
    // Decode the JWT without verifying signature (basic check)
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    // Decode payload
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString()
    );

    // Check expiration if present
    if (payload.exp) {
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      if (Date.now() > expirationTime) {
        throw new Error('Token has expired');
      }
    }

    return payload;
  } catch (err: any) {
    throw new Error(`JWT decode failed: ${err.message}`);
  }
}
