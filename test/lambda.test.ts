import { expect as expectCDK, haveResource } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import { LambdaStack } from '../lib/lambda';
import { DynamoStack, DynamoStackProps } from '../lib/dynamo';

describe('Lambda Test Cases', () => {
  test('Lambda Function Created', () => {
    const app = new cdk.App();
    const props = {
      tableName: 'posts',
    } as DynamoStackProps;
    // WHEN
    const dynamoStack = new DynamoStack(app, 'MyTableStack', props);
    const lambdaStack = new LambdaStack(
      app,
      'MyLambdaStack',
      dynamoStack.dynamoTable.tableArn,
      dynamoStack.dynamoTable.tableName,
    );
    // THEN
    expectCDK(lambdaStack).to(haveResource('AWS::Lambda::Function'));
  });

  test('Lambda Function Has Environment Variables', () => {
    const app = new cdk.App();
    const props = {
      tableName: 'posts',
    } as DynamoStackProps;
    // WHEN
    const dynamoStack = new DynamoStack(app, 'MyTableStack', props);
    const lambdaStack = new LambdaStack(
      app,
      'MyLambdaStack',
      dynamoStack.dynamoTable.tableArn,
      dynamoStack.dynamoTable.tableName,
    );
    // THEN
    expectCDK(lambdaStack).to(
      haveResource('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            TABLE_NAME: {
              'Fn::ImportValue': 'MyTableStack:ExportsOutputRefundefinedposts256D2E4C46E69658',
            },
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
          },
        },
      }),
    );
  });
});
