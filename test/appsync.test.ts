import { expect as expectCDK, haveResource } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import { AppSyncStack } from '../lib/appsync';
import { CognitoStack } from '../lib/cognito';
import { DynamoStack, DynamoStackProps } from '../lib/dynamo';
import { LambdaStack } from '../lib/lambda';

describe('AppSync Test Cases', () => {
  test('AppSync API Created', () => {
    const app = new cdk.App();
    // WHEN
    const props = {
      tableName: 'posts',
    } as DynamoStackProps;
    const dynamoStack = new DynamoStack(app, 'MyTableStack', props);
    const lambdaStack = new LambdaStack(
      app,
      'MyLambdaStack',
      dynamoStack.dynamoTable.tableArn,
      dynamoStack.dynamoTable.tableName,
    );
    const cognitoStack = new CognitoStack(app, 'MyPoolStack');
    const appsyncStack = new AppSyncStack(app, 'MyAPIStack', dynamoStack, lambdaStack, cognitoStack);
    // THEN
    expectCDK(appsyncStack).to(haveResource('AWS::AppSync::GraphQLApi'));
  });

  test('AppSync API Has DataSources', () => {
    const app = new cdk.App();
    // WHEN
    const props = {
      tableName: 'posts',
    } as DynamoStackProps;
    const dynamoStack = new DynamoStack(app, 'MyTableStack', props);
    const lambdaStack = new LambdaStack(
      app,
      'MyLambdaStack',
      dynamoStack.dynamoTable.tableArn,
      dynamoStack.dynamoTable.tableName,
    );
    const cognitoStack = new CognitoStack(app, 'MyPoolStack');
    const appsyncStack = new AppSyncStack(app, 'MyAPIStack', dynamoStack, lambdaStack, cognitoStack);
    // THEN
    expectCDK(appsyncStack).to(
      haveResource('AWS::AppSync::GraphQLApi', {
        AuthenticationType: 'AMAZON_COGNITO_USER_POOLS',
        Name: 'undefined-undefined-api',
        UserPoolConfig: {
          AwsRegion: {
            Ref: 'AWS::Region',
          },
          DefaultAction: 'ALLOW',
          UserPoolId: {
            'Fn::ImportValue': 'MyPoolStack:ExportsOutputRefundefinedmyUserPoolCE2F924C44C887A8',
          },
        },
        XrayEnabled: true,
      }),
    );
  });
});
