# FlashFusion Web Application

## Overview

The main web application built with Next.js 14, providing the primary user interface for FlashFusion. This application serves as the central hub for user interactions and showcases the full capabilities of the FlashFusion platform.

## Features

- **🚀 Next.js 14**: Latest Next.js with App Router
- **⚡ TypeScript**: Full type safety throughout the application
- **🎨 Design System**: Integrated FlashFusion UI components
- **🔒 Authentication**: Secure user authentication and authorization
- **📱 Responsive**: Mobile-first responsive design
- **🧪 Testing**: Comprehensive test coverage with Jest and Testing Library
- **♿ Accessibility**: WCAG 2.1 AA compliant

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + FlashFusion UI
- **State Management**: React Context + Zustand
- **Authentication**: NextAuth.js
- **Database**: Prisma + PostgreSQL
- **Testing**: Jest + React Testing Library
- **E2E Testing**: Playwright

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- PostgreSQL database

### Installation

```bash
# From the root of the monorepo
npm install

# Start development server
npm run dev --workspace=@flashfusion/web
```

The application will be available at `http://localhost:3000`

### Environment Variables

Create `.env.local` in the root directory:

```bash
# Database
DATABASE_URL="postgresql://localhost:5432/flashfusion"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# API Keys
ANTHROPIC_API_KEY="your-anthropic-key"
```

## Project Structure

```
apps/web/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── (auth)/            # Authentication routes
│   │   ├── (dashboard)/       # Dashboard routes
│   │   ├── api/               # API routes
│   │   ├── globals.css        # Global styles
│   │   └── layout.tsx         # Root layout
│   │
│   ├── components/            # React components
│   │   ├── ui/               # UI components
│   │   ├── forms/            # Form components
│   │   └── layout/           # Layout components
│   │
│   ├── lib/                   # Utility libraries
│   │   ├── auth.ts           # Authentication configuration
│   │   ├── db.ts             # Database connection
│   │   └── utils.ts          # Utility functions
│   │
│   ├── hooks/                 # Custom React hooks
│   ├── stores/                # State management stores
│   ├── types/                 # TypeScript type definitions
│   └── __tests__/             # Test files
│
├── public/                    # Static assets
├── next.config.js             # Next.js configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Package configuration
```

## Development

### Available Scripts

```bash
# Development
npm run dev                    # Start development server
npm run build                  # Build for production
npm run start                  # Start production server

# Code Quality
npm run lint                   # Run ESLint
npm run type-check             # TypeScript type checking

# Testing
npm run test                   # Run unit tests
npm run test:watch             # Run tests in watch mode
npm run test:e2e               # Run E2E tests
```

### Adding New Features

1. **Create Components**: Add new components in `src/components/`
2. **Add Routes**: Create new routes in `src/app/`
3. **State Management**: Add stores in `src/stores/`
4. **API Integration**: Create API routes in `src/app/api/`
5. **Testing**: Add tests in `src/__tests__/`

### Component Example

```tsx
// src/components/UserProfile.tsx
import { Card, Avatar, Button } from '@flashfusion/ui';
import { User } from '@flashfusion/shared/types';

interface UserProfileProps {
  user: User;
  onEdit: () => void;
}

export function UserProfile({ user, onEdit }: UserProfileProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center space-x-4">
        <Avatar src={user.avatar} alt={user.name} size="lg" />
        <div>
          <h2 className="text-xl font-semibold">{user.name}</h2>
          <p className="text-gray-600">{user.email}</p>
        </div>
        <Button onClick={onEdit} variant="outline">
          Edit Profile
        </Button>
      </div>
    </Card>
  );
}
```

## API Routes

### Authentication

- `POST /api/auth/signin` - User sign in
- `POST /api/auth/signout` - User sign out
- `GET /api/auth/session` - Get current session

### User Management

- `GET /api/users` - List users
- `GET /api/users/[id]` - Get user by ID
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

### AI Agents

- `POST /api/agents/execute` - Execute agent workflow
- `GET /api/agents/status/[id]` - Get execution status
- `GET /api/agents/history` - Get execution history

## State Management

### Context Providers

```tsx
// src/app/providers.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@flashfusion/ui';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
```

### Custom Hooks

```tsx
// src/hooks/useUser.ts
import { useSession } from 'next-auth/react';
import { User } from '@flashfusion/shared/types';

export function useUser() {
  const { data: session, status } = useSession();
  
  return {
    user: session?.user as User | undefined,
    isLoading: status === 'loading',
    isAuthenticated: !!session?.user,
  };
}
```

## Testing

### Unit Testing

```tsx
// src/__tests__/components/UserProfile.test.tsx
import { render, screen } from '@testing-library/react';
import { UserProfile } from '@/components/UserProfile';

const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  avatar: '/avatar.jpg',
};

describe('UserProfile', () => {
  it('renders user information correctly', () => {
    const onEdit = jest.fn();
    
    render(<UserProfile user={mockUser} onEdit={onEdit} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
  });
});
```

### E2E Testing

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('user can sign in', async ({ page }) => {
  await page.goto('/auth/signin');
  
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('[type="submit"]');
  
  await expect(page).toHaveURL('/dashboard');
});
```

## Deployment

### Build Process

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Environment Variables for Production

```bash
# Production environment
NODE_ENV=production
DATABASE_URL="postgresql://prod-url"
NEXTAUTH_SECRET="production-secret"
NEXTAUTH_URL="https://your-domain.com"
```

### Vercel Deployment

The application is configured for deployment on Vercel:

```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

## Performance Optimization

### Bundle Analysis

```bash
# Analyze bundle size
npm run analyze

# Check Core Web Vitals
npm run lighthouse
```

### Optimization Techniques

- **Code Splitting**: Automatic with Next.js App Router
- **Image Optimization**: Using Next.js Image component
- **Caching**: Proper cache headers and strategies
- **Tree Shaking**: Automatic dead code elimination

## Monitoring and Analytics

### Error Tracking

```typescript
// src/lib/monitoring.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Performance Monitoring

```typescript
// src/lib/analytics.ts
import { Analytics } from '@flashfusion/shared';

export const analytics = new Analytics({
  apiKey: process.env.ANALYTICS_API_KEY,
  endpoint: '/api/analytics',
});
```

## Security

### Authentication

- **NextAuth.js**: Secure authentication with multiple providers
- **Session Management**: Secure session handling
- **CSRF Protection**: Built-in CSRF protection

### Authorization

```typescript
// src/lib/auth.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    throw new Error('Authentication required');
  }
  
  return session;
}
```

### Data Validation

```typescript
// src/lib/validation.ts
import { z } from 'zod';

export const userSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  avatar: z.string().url().optional(),
});
```

## Contributing

See the main repository [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Create feature branch
2. Implement changes with tests
3. Run quality checks
4. Submit pull request
5. Code review and merge

### Code Style

- Follow TypeScript strict mode
- Use ESLint and Prettier configurations
- Write tests for new features
- Update documentation as needed

## License

MIT - See [LICENSE](../../LICENSE) for details.