import { expect as expectCDK, haveResource } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import { CognitoStack } from '../lib/cognito';

describe('AppSync Test Cases', () => {
  test('Pool Created', () => {
    const app = new cdk.App();
    // WHEN
    const cognitoStack = new CognitoStack(app, 'MyPoolStack');
    // THEN
    expectCDK(cognitoStack).to(haveResource('AWS::Cognito::UserPool'));
  });

  test('Pool has email attributes', () => {
    const app = new cdk.App();
    // WHEN
    const cognitoStack = new CognitoStack(app, 'MyPoolStack');
    // THEN
    expectCDK(cognitoStack).to(haveResource('AWS::Cognito::UserPool', { AutoVerifiedAttributes: ['email'] }));
  });
});
