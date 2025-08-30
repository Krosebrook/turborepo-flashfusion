# UI Components Package

## Overview

The `@flashfusion/ui` package provides a comprehensive design system and shared UI components for FlashFusion applications. Built with React, TypeScript, and Tailwind CSS, it ensures consistency and efficiency across all user interfaces.

## Features

- **React Components**: Reusable UI components
- **Design System**: Consistent design tokens and patterns
- **Tailwind CSS**: Utility-first CSS framework
- **TypeScript**: Full type safety
- **Storybook**: Component documentation and testing
- **Accessibility**: WCAG 2.1 AA compliant components

## Installation

```bash
# In your app
npm install @flashfusion/ui
```

## Usage

### Basic Components

```tsx
import { Button, Input, Card } from '@flashfusion/ui';

function LoginForm() {
  return (
    <Card>
      <Input 
        type="email" 
        placeholder="Email" 
        required 
      />
      <Input 
        type="password" 
        placeholder="Password" 
        required 
      />
      <Button variant="primary" type="submit">
        Sign In
      </Button>
    </Card>
  );
}
```

### Styling

```tsx
// Import the base styles
import '@flashfusion/ui/styles';

// Or use individual component styles
import { Button } from '@flashfusion/ui/components';
```

## Available Components

### Form Components
- `Button` - Various button styles and states
- `Input` - Text inputs with validation
- `Select` - Dropdown selections
- `Checkbox` - Checkbox inputs
- `Radio` - Radio button groups
- `TextArea` - Multi-line text inputs

### Layout Components
- `Card` - Content containers
- `Modal` - Overlay dialogs
- `Sidebar` - Navigation sidebars
- `Header` - Page headers
- `Footer` - Page footers
- `Container` - Content wrappers

### Data Display
- `Table` - Data tables with sorting
- `List` - Various list formats
- `Badge` - Status indicators
- `Avatar` - User profile images
- `Progress` - Progress indicators
- `Tooltip` - Hover information

### Navigation
- `Navbar` - Top navigation
- `Breadcrumb` - Breadcrumb navigation
- `Tabs` - Tab navigation
- `Pagination` - Page navigation

## Design System

### Colors

```css
/* Primary Colors */
--color-primary-50: #eff6ff;
--color-primary-500: #3b82f6;
--color-primary-900: #1e3a8a;

/* Semantic Colors */
--color-success: #10b981;
--color-warning: #f59e0b;
--color-error: #ef4444;
--color-info: #06b6d4;
```

### Typography

```css
/* Font Families */
--font-sans: 'Inter', sans-serif;
--font-mono: 'Fira Code', monospace;

/* Font Sizes */
--text-xs: 0.75rem;
--text-sm: 0.875rem;
--text-base: 1rem;
--text-lg: 1.125rem;
--text-xl: 1.25rem;
```

### Spacing

```css
/* Spacing Scale */
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-4: 1rem;
--space-8: 2rem;
--space-16: 4rem;
```

## Component Examples

### Button Variants

```tsx
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>
```

### Input with Validation

```tsx
<Input
  label="Email Address"
  type="email"
  placeholder="user@example.com"
  error="Please enter a valid email"
  required
/>
```

### Modal Usage

```tsx
<Modal 
  isOpen={isModalOpen} 
  onClose={() => setIsModalOpen(false)}
  title="Confirm Action"
>
  <p>Are you sure you want to proceed?</p>
  <div className="mt-4 flex gap-2">
    <Button variant="danger">Confirm</Button>
    <Button variant="outline" onClick={() => setIsModalOpen(false)}>
      Cancel
    </Button>
  </div>
</Modal>
```

## Customization

### Theme Configuration

```tsx
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        }
      }
    }
  }
}
```

### Custom Components

```tsx
import { Button } from '@flashfusion/ui';
import { cn } from '@flashfusion/shared/utils';

interface CustomButtonProps extends ButtonProps {
  gradient?: boolean;
}

export function CustomButton({ gradient, className, ...props }: CustomButtonProps) {
  return (
    <Button
      className={cn(
        gradient && 'bg-gradient-to-r from-blue-500 to-purple-600',
        className
      )}
      {...props}
    />
  );
}
```

## Development

### Storybook

View and test components in Storybook:

```bash
npm run storybook
```

### Testing

```bash
npm test
```

### Building

```bash
npm run build
```

## Contributing

See the main repository [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT - See [LICENSE](../../LICENSE) for details.