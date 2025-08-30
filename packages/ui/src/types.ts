/**
 * UI component types and interfaces
 */

import React from 'react';

// Component size variants
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Color variants
export type ColorVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

// Base component props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Theme configuration
export interface ThemeConfig {
  colors: {
    primary: ColorScale;
    secondary: ColorScale;
    gray: ColorScale;
    success: ColorScale;
    warning: ColorScale;
    error: ColorScale;
    info: ColorScale;
  };
  spacing: Record<string, string>;
  typography: {
    fontFamily: Record<string, string>;
    fontSize: Record<string, string>;
    fontWeight: Record<string, string>;
    lineHeight: Record<string, string>;
  };
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
  breakpoints: Record<string, string>;
}

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

// Component state types
export type ComponentState = 'default' | 'hover' | 'active' | 'disabled' | 'loading';

// Layout types
export type FlexDirection = 'row' | 'row-reverse' | 'col' | 'col-reverse';
export type JustifyContent = 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
export type AlignItems = 'start' | 'end' | 'center' | 'baseline' | 'stretch';

// Form types
export interface FormFieldProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
}

// Animation types
export type AnimationType = 'fade' | 'slide' | 'scale' | 'rotate' | 'bounce';
export type AnimationDirection = 'up' | 'down' | 'left' | 'right' | 'in' | 'out';

// Responsive types
export type ResponsiveValue<T> = T | {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
};

// Icon types
export interface IconProps extends BaseComponentProps {
  size?: Size;
  color?: string;
  strokeWidth?: number;
}

// Modal and overlay types
export interface OverlayProps {
  isOpen: boolean;
  onClose: () => void;
  closeOnEscape?: boolean;
  closeOnClickOutside?: boolean;
}

// Navigation types
export interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ComponentType<IconProps>;
  children?: NavigationItem[];
  disabled?: boolean;
}