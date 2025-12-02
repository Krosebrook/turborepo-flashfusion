# FlashFusion Build & Package Agent

The FlashFusion Build & Package Agent is a comprehensive build automation tool designed to compile source code, bundle assets, and prepare deployable artifacts for the FlashFusion monorepo.

## Features

- 🔍 **Automatic Package Discovery**: Discovers all packages in the monorepo
- 🏗️ **Intelligent Build System**: Handles different package types (Next.js, Node.js, TypeScript)
- 📦 **Artifact Collection**: Collects and catalogs all build artifacts
- 📊 **Comprehensive Reporting**: Generates detailed build reports with metrics
- 🚀 **CI/CD Ready**: Integrates seamlessly with GitHub Actions and other CI systems
- 📋 **Build Logging**: Detailed logging of all build operations
- 🎯 **Deployable Packages**: Creates deployment-ready artifacts

## Usage

### Command Line Interface

```bash
# Run full build process
node tools/build-package-agent.js build

# Discover packages only
node tools/build-package-agent.js discover

# Install dependencies only
node tools/build-package-agent.js install

# Collect artifacts only
node tools/build-package-agent.js artifacts

# Generate build report only
node tools/build-package-agent.js report
```

### Via FlashFusion CLI

```bash
# Enhanced build with Build Agent
npm run ff build

# Run Build Agent directly
npm run ff build:agent

# Discover packages
npm run ff build:discover

# Collect artifacts
npm run ff build:artifacts
```

## Build Process

The Build & Package Agent follows this comprehensive process:

1. **🔍 Package Discovery**: Scans the monorepo for packages in `apps/*`, `packages/*`, and `tools/*`
2. **📦 Dependency Installation**: Installs all dependencies using `npm ci` or `npm install`
3. **🔍 Code Linting**: Runs ESLint on all packages (non-blocking)
4. **📝 Type Checking**: Runs TypeScript type checking (non-blocking)
5. **🏗️ Package Building**: Builds each package according to its configuration
6. **📦 Artifact Collection**: Collects all build outputs (`.next`, `dist`, `build`, etc.)
7. **🧪 Test Execution**: Runs all tests (non-blocking)
8. **📦 Package Creation**: Creates a deployable tar.gz package
9. **📊 Report Generation**: Generates comprehensive build report

## Build Outputs

### Build Artifacts Directory: `.build-artifacts/`

- `build-{buildId}.log`: Detailed build logs
- `build-report-{buildId}.json`: Comprehensive build report
- `deployable-{buildId}.tar.gz`: Deployable package

### Artifact Types Collected

- **Next.js**: `.next/` directories
- **Build outputs**: `dist/`, `build/`, `out/` directories
- **Libraries**: `lib/` directories
- **Storybook**: `storybook-static/` directories

## Build Report Structure

```json
{
  "buildId": "20250917T102230-0qkxw",
  "timestamp": "2025-09-17T10:22:45.005Z",
  "buildTime": 14186,
  "artifacts": [
    {
      "path": "/full/path/to/artifact",
      "relativePath": "apps/web/.next",
      "type": ".next",
      "size": 1234567,
      "created": "2025-09-17T10:22:45.005Z",
      "package": "@flashfusion/web"
    }
  ],
  "buildResults": [
    {
      "package": "@flashfusion/web",
      "buildTime": 12000,
      "artifacts": [...],
      "success": true
    }
  ],
  "deployablePackage": {
    "path": "/path/to/deployable.tar.gz",
    "size": 68450,
    "created": "2025-09-17T10:22:45.005Z"
  },
  "environment": {
    "nodeVersion": "v18.17.0",
    "platform": "linux",
    "cwd": "/workspace",
    "ci": true
  },
  "summary": {
    "totalArtifacts": 5,
    "totalSize": 12345678,
    "buildTimeFormatted": "14s"
  }
}
```

## CI/CD Integration

### GitHub Actions

The agent includes a complete GitHub Actions workflow (`.github/workflows/build-package.yml`) that:

- Runs builds on multiple Node.js versions
- Uploads build artifacts and reports
- Creates PR comments with build results
- Handles staging and production deployments

### Environment Variables

The agent respects these environment variables:

- `CI`: Detects CI environment
- `NODE_ENV`: Build environment
- `TURBO_TOKEN`: Turborepo remote cache token
- `VERCEL_TOKEN`: Vercel deployment token

## Package Type Support

### Next.js Applications
- Automatically detects Next.js apps
- Uses `npm run build` instead of direct `next build`
- Collects `.next/` artifacts

### Node.js APIs
- Handles pure Node.js packages
- Skips build if no artifacts are generated
- Supports both CommonJS and ES modules

### TypeScript Packages
- Detects TypeScript configuration
- Runs type checking
- Collects `dist/` artifacts

### Shared Libraries
- Handles utility and shared packages
- Supports various build outputs
- Optimizes for reuse across packages

## Error Handling

The Build & Package Agent is designed to be resilient:

- **Non-blocking checks**: Linting, type checking, and tests don't fail the build
- **Graceful degradation**: Continues building other packages if one fails
- **Detailed logging**: All errors are logged with context
- **Partial success**: Generates reports even with some failures

## Performance Features

- **Parallel builds**: Where possible, builds run in parallel
- **Build caching**: Respects Turborepo caching
- **Artifact deduplication**: Avoids duplicate artifact collection
- **Size optimization**: Compresses deployable packages

## Customization

### Adding New Artifact Types

To add support for new artifact types, modify the `collectArtifacts` method:

```javascript
const artifactPaths = [
    '.next',
    'dist',
    'build',
    'out',
    'lib',
    'storybook-static',
    'your-new-artifact-type' // Add here
];
```

### Custom Build Commands

Packages can specify custom build commands in their `package.json`:

```json
{
  "scripts": {
    "build": "your-custom-build-command"
  }
}
```

## Troubleshooting

### Common Issues

1. **"next: command not found"**: Package dependencies not installed
2. **ESLint configuration missing**: Add `.eslintrc.js` to package
3. **Build artifacts not found**: Check output paths configuration
4. **Permission denied**: Ensure build agent script is executable

### Debug Mode

Enable verbose logging by setting environment variables:

```bash
DEBUG=1 node tools/build-package-agent.js build
```

## Integration with Existing Tools

The Build & Package Agent integrates with:

- **Turborepo**: Uses existing turbo.json configuration
- **ESLint**: Respects package-level ESLint configurations
- **TypeScript**: Uses package-level tsconfig.json files
- **Next.js**: Handles Next.js build process automatically
- **Vercel**: Compatible with Vercel deployment workflows

## Future Enhancements

Planned improvements include:

- 🔄 **Incremental builds**: Only build changed packages
- 📊 **Build analytics**: Track build performance over time
- 🚀 **Deployment integration**: Direct deployment from agent
- 🔧 **Custom plugins**: Support for custom build steps
- 📱 **Mobile builds**: React Native and Expo support