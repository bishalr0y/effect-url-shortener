# JWT Implementation Guide

## Current JWT Implementation
This codebase already has JWT implemented in `src/services/user-service.ts:41-57`:
- Tokens are generated on signup/signin with 1-hour expiration
- Uses `jsonwebtoken` library (already in dependencies)
- Contains user ID and email in token payload
- Uses audience ("user") and issuer ("admin") claims

## Best Way to Use JWT in This Codebase

### 1. Add JWT Middleware for Protected Routes
Create `src/middleware/auth.ts`:

```typescript
import { Context, Next } from "hono";
import jwt from "jsonwebtoken";

export const authMiddleware = async (c: Context, next: Next) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  
  if (!token) {
    return c.json({ error: "No token provided" }, 401);
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    c.set("userId", decoded.data.id);
    c.set("userEmail", decoded.data.email);
    await next();
  } catch (error) {
    return c.json({ error: "Invalid token" }, 401);
  }
};
```

### 2. Update URL Routes to Use Authentication
Modify `src/index.ts:19-21` to protect URL endpoints:

```typescript
import { authMiddleware } from "./middleware/auth";

// Protected routes
app.post("url/shorten", authMiddleware, shortenHandler);
app.get("url/:code/info", authMiddleware, infoHandler);

// Public route (no auth needed)
app.get("url/:code", redirectHandler);
```

### 3. Update URL Controllers to Use User Context
Modify `src/controllers/url-controllers.ts` to get userId from context:

```typescript
// In shortenHandler - replace userIdFk from request body with authenticated user
export const shortenHandler = async (c: Context) => {
  const program = Effect.gen(function* () {
    const urlService = yield* UrlService;
    const body = yield* Effect.promise(() => c.req.json());
    
    // Get authenticated user ID instead of from request body
    const userId = c.get("userId");
    const { url } = yield* Schema.decodeUnknown(ShortenRequestOmitUser)({ url });
    
    const shortCode = yield* urlService.shortenUrl(url, userId);
    
    return yield* Schema.encode(ShortenResponse)({
      ok: true,
      message: "URL shortened successfully",
      code: shortCode,
    });
  });
  // ... rest of the handler
};

// Update schema to omit userIdFk from request
export const ShortenRequestOmitUser = Schema.Struct({
  url: Schema.String,
});
```

### 4. Add Token Refresh (Optional Enhancement)
Add refresh token functionality in `src/services/user-service.ts`:

```typescript
// Add to UserService interface
refreshToken: (refreshToken: string) => Effect.Effect<
  string,
  DatabaseError | UserDoesntExistsError | InvalidTokenError
>;

// Add token generation helper
const generateRefreshToken = (id: string, email: string) => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET not found in env");
  }

  return jwt.sign(
    { data: { id, email } },
    secret,
    { expiresIn: "7d", audience: "user", issuer: "admin" }
  );
};
```

### 5. Environment Configuration
Ensure these are set in your `.env` file:

```bash
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-refresh-token-secret-here
```

### 6. Update Database Schema Integration
Since `src/db/schema.ts:16-19` already has the `user_id_fk` relationship, make sure your URL service uses the authenticated user ID when creating URLs.

### 7. Add User Context Type Declaration
Create `src/types/hono.ts`:

```typescript
import { Context } from "hono";

declare module "hono" {
  interface ContextVariableMap {
    userId: string;
    userEmail: string;
  }
}
```

## Security Best Practices
1. **Always validate JWT signature** using the secret
2. **Use HTTPS** in production to prevent token interception
3. **Set appropriate expiration times** (1 hour for access tokens)
4. **Implement token rotation** for refresh tokens
5. **Store tokens securely** on the client side (httpOnly cookies recommended)
6. **Add rate limiting** to prevent brute force attacks

## Current Token Structure
```json
{
  "data": {
    "id": "user-uuid",
    "email": "user@example.com"
  },
  "iat": 1234567890,
  "exp": 1234567890,
  "aud": "user",
  "iss": "admin"
}
```

## Integration Checklist
- [ ] Create auth middleware
- [ ] Protect URL endpoints
- [ ] Update controllers to use authenticated user ID
- [ ] Update request schemas to remove userId from request body
- [ ] Add type declarations for Hono context
- [ ] Test authentication flow
- [ ] Consider adding refresh tokens
- [ ] Update API documentation