# Effect URL Shortener

A modern URL shortener API built with **Effect.ts**, demonstrating functional programming principles, type-safe error handling, and composable effects in TypeScript.

## 🚀 Features

- **URL Shortening**: Convert long URLs into short, shareable codes
- **User Authentication**: JWT-based signup/signin system
- **Database Integration**: PostgreSQL with Drizzle ORM
- **Type-Safe Error Handling**: Comprehensive error management using Effect.ts
- **Functional Architecture**: Leverages Effect.ts for composability and type safety

## 🛠️ Tech Stack

### Core Framework
- **[Effect.ts](https://effect.website/)** - Functional effect system for TypeScript
- **[Hono](https://hono.dev/)** - Fast web framework
- **[Bun](https://bun.sh/)** - JavaScript runtime and bundler

### Database & ORM
- **PostgreSQL** - Primary database
- **[Drizzle ORM](https://orm.drizzle.team/)** - Type-safe SQL toolkit

### Additional Libraries
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT token generation
- **dotenv** - Environment variable management

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd effect-url-shortener

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your database configuration
```

## 🗄️ Database Setup

```bash
# Run database migrations
bun run db:push

# Or use Docker Compose for development
docker-compose up -d
```

## 🚀 Getting Started

```bash
# Start development server
bun run dev

# The API will be available at http://localhost:3000
```

## 📡 API Endpoints

### Authentication
- `POST /auth/signup` - Create a new user account
- `POST /auth/signin` - Sign in and get JWT token

### URL Management
- `POST /url/shorten` - Create a shortened URL (requires authentication)
- `GET /url/:code` - Redirect to original URL
- `GET /url/:code/info` - Get URL information (requires authentication)

### User Management
- `GET /users` - Get all users (requires authentication)
- `GET /users/:id` - Get specific user (requires authentication)

## 🏗️ Architecture with Effect.ts

This project showcases **Effect.ts** patterns for building robust, type-safe applications:

### 1. Service Layer Architecture

```typescript
// Service definition with typed effects
export class UrlService extends Context.Tag("app/UrlService")<
  UrlService,
  {
    shortenUrl: (url: string, userIdFk: string) => Effect.Effect<
      string,
      DatabaseError | UrlAlreadyExistsError | UrlValidationError
    >;
    resolveUrl: (code: string) => Effect.Effect<Url | null, DatabaseError>;
  }
>() {}
```

### 2. Dependency Injection with Layers

```typescript
// Centralized dependency injection
export const userLayer = UserServiceLive.pipe(Layer.provide(UserRepositoryLive));
export const urlLayer = UrlServiceLive.pipe(Layer.provide(UrlRepositoryLive));
export const appLayer = Layer.mergeAll(userLayer, urlLayer);
```

### 3. Composable Error Handling

```typescript
// Type-safe error handling with tagged errors
export class UrlValidationError extends Data.TaggedError("UrlValidationError")<{
  readonly message: string;
}> {}

// Error handling in controllers
Effect.catchTag("UrlValidationError", (error) =>
  Effect.gen(function* () {
    yield* Effect.logError("UrlValidationError", { message: error.message });
    return { ok: false, message: error.message, statusCode: 400 };
  }),
)
```

### 4. Schema Validation

```typescript
// Runtime type validation with Effect schemas
export const ShortenRequest = Schema.Struct({
  url: Schema.String,
  userIdFk: Schema.String,
});

const { url, userIdFk } = yield* Schema.decodeUnknown(ShortenRequest)(body);
```

### 5. Effect-Based Business Logic

```typescript
// Composable business logic with Effect.gen
const shortenUrl = (url: string, userIdfk: string) =>
  Effect.gen(function* () {
    // Validate URL
    yield* validateUrl(url);
    
    // Generate unique code with retry logic
    let code: string;
    let attempts = 0;
    
    do {
      code = generateCode();
      const existing = yield* repo.checkIfCodeExists(code);
      if (!existing) break;
      attempts++;
    } while (attempts < maxAttempts);
    
    // Create record
    yield* repo.create(url, code, userIdfk);
    return code;
  });
```

## 🧪 Development

```bash
# Type checking
bun run typecheck

# Database operations
bun run db:push    # Push schema changes
bun run db:studio  # Open Drizzle Studio
```


## 📝 Project Structure

```
src/
├── controllers/        # HTTP request handlers
├── services/          # Business logic layer
├── repositories/      # Data access layer
├── middleware/        # Authentication middleware
├── db/               # Database schema and configuration
├── lib/              # Utility libraries
├── layers.ts         # Dependency injection layers
├── schemas.ts        # Effect schemas for validation
└── errors.ts         # Typed error definitions
```
