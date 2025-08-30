/**
 * Application constants
 */

export const APP_NAME = 'FlashFusion TurboRepo';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'A modern monorepo template with AI agent integration';

export const AGENT_TYPES = {
  ORCHESTRATOR: 'orchestrator',
  EXECUTOR: 'executor',
  ANALYZER: 'analyzer',
  COMMUNICATOR: 'communicator',
} as const;

export const WORKSPACE_TYPES = {
  APP: 'app',
  PACKAGE: 'package',
  TOOL: 'tool',
} as const;

export const FRAMEWORKS = {
  NEXT: 'next',
  EXPRESS: 'express',
  VITE: 'vite',
  LIBRARY: 'library',
} as const;

export const DEFAULT_PORTS = {
  WEB: 3000,
  API: 3001,
  DASHBOARD: 3002,
  DOCS: 3003,
} as const;