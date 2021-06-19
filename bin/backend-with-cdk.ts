#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { AppSyncStack } from '../lib/appsync';
import { CognitoStack } from '../lib/cognito';
import { DynamoStack, DynamoStackProps } from '../lib/dynamo';
import { LambdaStack } from '../lib/lambda';

const app = new cdk.App();

const props = {
  tableName: 'posts',
} as DynamoStackProps;

const dynamoStack = new DynamoStack(app, 'DynamoStack', props);
const lambdaStack = new LambdaStack(
  app,
  'LambdaStack',
  dynamoStack.dynamoTable.tableArn,
  dynamoStack.dynamoTable.tableName,
);
const cognitoStack = new CognitoStack(app, 'CognitoStack');
new AppSyncStack(app, 'AppSyncStack', dynamoStack, lambdaStack, cognitoStack);
