# Shared Package

## Overview

The `@flashfusion/shared` package contains common utilities, types, and functionality shared across all FlashFusion applications and packages. This ensures consistency and reduces code duplication across the monorepo.

## Features

- **Common Types**: TypeScript interfaces and types used across applications
- **Utility Functions**: Reusable helper functions and utilities
- **Constants**: Shared constants and configuration values
- **Validators**: Common validation logic and schemas
- **Error Handling**: Standardized error types and handling

## Installation

```bash
# Already available in the monorepo workspace
npm install @flashfusion/shared
```

## Usage

### Types

```typescript
import { User, ApiResponse, WorkflowStep } from '@flashfusion/shared/types';

interface UserProfile extends User {
  preferences: UserPreferences;
}
```

### Utilities

```typescript
import { formatDate, validateEmail, createId } from '@flashfusion/shared/utils';

const userId = createId();
const isValid = validateEmail('user@example.com');
const formatted = formatDate(new Date());
```

### Constants

```typescript
import { API_ENDPOINTS, ERROR_CODES } from '@flashfusion/shared';

const apiUrl = API_ENDPOINTS.USERS;
const errorCode = ERROR_CODES.VALIDATION_FAILED;
```

## Package Structure

```
packages/shared/
├── src/
│   ├── types/           # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── constants/      # Shared constants
│   ├── validators/     # Validation schemas
│   └── errors/         # Error handling
├── dist/               # Built JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

## API Reference

### Types

- `User`: User entity interface
- `ApiResponse<T>`: Standardized API response format
- `WorkflowStep`: Agent workflow step definition
- `DatabaseEntity`: Base entity with common fields
- `PaginationParams`: Pagination parameters interface

### Utilities

- `createId()`: Generate unique identifiers
- `formatDate()`: Format dates consistently
- `validateEmail()`: Email validation
- `sanitizeInput()`: Input sanitization
- `deepMerge()`: Deep object merging

### Constants

- `API_ENDPOINTS`: API endpoint URLs
- `ERROR_CODES`: Standardized error codes
- `DEFAULT_PAGINATION`: Default pagination settings
- `VALIDATION_RULES`: Common validation rules

## Contributing

See the main repository [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT - See [LICENSE](../../LICENSE) for details.