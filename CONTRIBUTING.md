# Contributing to FlashFusion Turborepo

Thank you for your interest in contributing to FlashFusion Turborepo! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)

## Code of Conduct

This project adheres to a code of conduct adapted from the [Contributor Covenant](https://www.contributor-covenant.org/). By participating, you are expected to uphold this code.

### Our Standards

- **Be respectful**: Treat everyone with respect and kindness
- **Be inclusive**: Welcome newcomers and help them get started
- **Be collaborative**: Work together to improve the project
- **Be constructive**: Provide helpful feedback and suggestions

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- Node.js 18+ installed
- npm or pnpm package manager
- Git version control
- Basic understanding of TypeScript and React
- Familiarity with Turborepo concepts

### Development Environment

1. **Fork the Repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/turborepo-flashfusion.git
   cd turborepo-flashfusion
   ```

2. **Add Upstream Remote**
   ```bash
   git remote add upstream https://github.com/Krosebrook/turborepo-flashfusion.git
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Verify Setup**
   ```bash
   npm run build
   npm run test
   ```

## Development Setup

### Local Development

1. **Start Development Environment**
   ```bash
   npm run dev
   ```

2. **Run Tests**
   ```bash
   npm run test
   npm run test:watch
   ```

3. **Code Quality Checks**
   ```bash
   npm run lint
   npm run type-check
   npm run format
   ```

### Environment Configuration

Create a `.env.local` file:

```bash
# Database
DATABASE_URL="postgresql://localhost:5432/flashfusion_dev"

# Redis
REDIS_URL="redis://localhost:6379"

# API Keys (for testing)
ANTHROPIC_API_KEY="your-test-key"
SUPABASE_URL="your-test-url"
```

## Contributing Guidelines

### Types of Contributions

We welcome several types of contributions:

1. **🐛 Bug Fixes**: Fix issues in existing code
2. **✨ New Features**: Add new functionality
3. **📚 Documentation**: Improve or add documentation
4. **🧪 Tests**: Add or improve test coverage
5. **♻️ Refactoring**: Improve code structure
6. **🎨 UI/UX**: Enhance user interface and experience

### Before You Start

1. **Check existing issues**: Look for existing issues or discussions
2. **Create an issue**: For significant changes, create an issue first
3. **Discuss your approach**: Get feedback before implementing
4. **Follow conventions**: Adhere to existing patterns and styles

### Branch Naming Convention

Use descriptive branch names following this pattern:

```
type/short-description

Examples:
- feature/user-authentication
- bugfix/navigation-mobile-issue
- docs/contributing-guidelines
- refactor/agent-patterns-cleanup
```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code style changes
- refactor: Code refactoring
- test: Adding or updating tests
- chore: Maintenance tasks

Examples:
- feat(ui): add new Button component variants
- fix(api): resolve authentication middleware issue
- docs(readme): update installation instructions
- test(agents): add unit tests for orchestrator
```

## Pull Request Process

### Before Submitting

1. **Update from upstream**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run quality checks**:
   ```bash
   npm run lint
   npm run test
   npm run build
   ```

3. **Update documentation**:
   - Update README.md if needed
   - Add/update code comments
   - Update package documentation

### Pull Request Checklist

- [ ] **Tests**: All tests pass and new tests added for new functionality
- [ ] **Linting**: Code passes all linting checks
- [ ] **Type Safety**: TypeScript compilation succeeds
- [ ] **Documentation**: Updated for new features or changes
- [ ] **Performance**: No significant performance regression
- [ ] **Breaking Changes**: Documented and justified
- [ ] **Security**: No security vulnerabilities introduced

### PR Description Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added and passing
```

## Issue Guidelines

### Bug Reports

When reporting bugs, include:

1. **Environment Information**:
   - OS and version
   - Node.js version
   - npm/pnpm version
   - Browser (if applicable)

2. **Steps to Reproduce**:
   - Clear, numbered steps
   - Expected vs actual behavior
   - Screenshots/videos if helpful

3. **Code Examples**:
   - Minimal reproduction case
   - Relevant configuration files

### Feature Requests

For feature requests, provide:

1. **Problem Statement**: What problem does this solve?
2. **Proposed Solution**: How should it work?
3. **Alternatives**: What alternatives have you considered?
4. **Additional Context**: Any additional information

### Issue Template

```markdown
## Description
Clear description of the issue

## Environment
- OS: [e.g., macOS 13.0]
- Node.js: [e.g., 18.17.0]
- npm: [e.g., 9.6.7]
- Browser: [e.g., Chrome 115]

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What you expected to happen

## Actual Behavior
What actually happened

## Additional Context
Any other context about the problem
```

## Coding Standards

### TypeScript Guidelines

1. **Strict Mode**: Always use TypeScript strict mode
2. **Explicit Types**: Prefer explicit types over `any`
3. **Interfaces**: Use interfaces for object shapes
4. **Enums**: Use const assertions or unions over enums

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

const THEMES = ['light', 'dark'] as const;
type Theme = typeof THEMES[number];

// Avoid
any, unknown without proper handling
```

### React Component Guidelines

1. **Functional Components**: Use functional components with hooks
2. **Props Interface**: Define explicit props interfaces
3. **Default Props**: Use default parameters instead of defaultProps
4. **Ref Forwarding**: Use forwardRef for components that need refs

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  children,
  onClick,
}) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size }))}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

### Styling Guidelines

1. **Tailwind CSS**: Use Tailwind utilities for styling
2. **Component Variants**: Use cva (class-variance-authority) for variants
3. **Responsive Design**: Mobile-first approach
4. **Semantic HTML**: Use appropriate HTML elements

```tsx
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);
```

## Testing Requirements

### Test Coverage

- **Minimum Coverage**: 80% for new code
- **Unit Tests**: All utility functions and components
- **Integration Tests**: API endpoints and workflows
- **E2E Tests**: Critical user flows

### Testing Patterns

1. **Unit Tests**: Use Jest and React Testing Library
2. **Integration Tests**: Test component interactions
3. **E2E Tests**: Use Playwright for end-to-end testing

```typescript
// Unit test example
describe('createId', () => {
  it('should generate unique identifiers', () => {
    const id1 = createId();
    const id2 = createId();
    
    expect(id1).toBeDefined();
    expect(id2).toBeDefined();
    expect(id1).not.toBe(id2);
  });
});

// Component test example
describe('Button', () => {
  it('should render with correct variant', () => {
    render(<Button variant="secondary">Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toHaveClass('bg-gray-200');
  });
});
```

### Test File Structure

```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── Button.stories.tsx
│   └── ...
├── utils/
│   ├── createId.ts
│   ├── createId.test.ts
│   └── ...
└── __tests__/
    ├── integration/
    └── e2e/
```

## Documentation

### Documentation Standards

1. **README Files**: Each package should have a comprehensive README
2. **API Documentation**: Document all public APIs
3. **Code Comments**: Use JSDoc for functions and complex logic
4. **Examples**: Provide usage examples

### Documentation Structure

```markdown
# Package Name

## Overview
Brief description of the package

## Installation
How to install and set up

## Usage
Basic usage examples

## API Reference
Detailed API documentation

## Examples
More complex examples

## Contributing
Link to contributing guidelines
```

### JSDoc Comments

```typescript
/**
 * Creates a unique identifier string
 * 
 * @param prefix - Optional prefix for the ID
 * @param length - Length of the random portion (default: 8)
 * @returns A unique identifier string
 * 
 * @example
 * ```typescript
 * const id = createId('user', 12);
 * // Returns: "user_abc123def456"
 * ```
 */
export function createId(prefix?: string, length: number = 8): string {
  // Implementation
}
```

## Package-Specific Guidelines

### Apps

- Follow Next.js best practices
- Use app router for new features
- Implement proper SEO optimization
- Ensure mobile responsiveness

### Packages

- Export clear, consistent APIs
- Provide comprehensive documentation
- Include usage examples
- Maintain backward compatibility

### Tools

- Follow CLI best practices
- Provide helpful error messages
- Include comprehensive help text
- Support common use cases

## Release Process

### Version Management

We use semantic versioning (semver):

- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features, backward compatible
- **Patch** (0.0.1): Bug fixes, backward compatible

### Release Steps

1. **Update Version**: Update package.json versions
2. **Update Changelog**: Document changes in CHANGELOG.md
3. **Create Release**: Use GitHub releases
4. **Publish Packages**: Publish to npm registry

## Getting Help

### Resources

- **Documentation**: Check existing documentation first
- **Issues**: Search existing issues
- **Discussions**: Use GitHub Discussions for questions
- **Discord**: Join our Discord community

### Contact

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and discussions
- **Email**: development@flashfusion.dev

## Recognition

Contributors are recognized in several ways:

- **Contributors List**: Added to README.md
- **Release Notes**: Mentioned in release notes
- **Hall of Fame**: Featured contributors page
- **Swag**: Special contributor merchandise

Thank you for contributing to FlashFusion Turborepo! 🚀