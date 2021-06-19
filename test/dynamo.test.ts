import { expect as expectCDK, haveResource } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import { DynamoStack, DynamoStackProps } from '../lib/dynamo';

describe('Dynamo Test Cases', () => {
  test('DynamoDB Table Created', () => {
    const app = new cdk.App();
    const props = {
      tableName: 'posts',
    } as DynamoStackProps;
    // WHEN
    const dynamoStack = new DynamoStack(app, 'MyTableStack', props);
    // THEN
    expectCDK(dynamoStack).to(haveResource('AWS::DynamoDB::Table'));
  });
});
