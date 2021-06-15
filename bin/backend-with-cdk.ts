#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { BackendWithCdkStack } from '../lib/backend-with-cdk-stack';

const app = new cdk.App();
new BackendWithCdkStack(app, 'BackendWithCdkStack');
