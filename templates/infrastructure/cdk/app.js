#!/usr/bin/env node

import * as cdk from 'aws-cdk-lib';
import { FlashFusionStack } from './lib/flashfusion-stack.js';

const app = new cdk.App();

// Get environment configuration
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-west-2'
};

const environment = app.node.tryGetContext('environment') || 'dev';

// Create the FlashFusion stack
new FlashFusionStack(app, `FlashFusion-${environment}`, {
  env,
  description: `FlashFusion infrastructure for ${environment} environment`,
  tags: {
    Project: 'FlashFusion',
    Environment: environment,
    ManagedBy: 'CDK'
  }
});