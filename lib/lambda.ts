import { LayerVersion, Code, Runtime } from '@aws-cdk/aws-lambda';
import * as cdk from '@aws-cdk/core';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { PolicyStatement } from '@aws-cdk/aws-iam';
import { Rule, Schedule } from '@aws-cdk/aws-events';
import { LambdaFunction } from '@aws-cdk/aws-events-targets';
import * as path from 'path';

export class LambdaStack extends cdk.Stack {
  public readonly myLambda: NodejsFunction;
  private env: string = this.node.tryGetContext('environment');

  constructor(scope: cdk.App, id: string, tableArn: string, tableName: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 👇 layer for logging
    const loggerLayer = new LayerVersion(this, 'logger-layer', {
      compatibleRuntimes: [Runtime.NODEJS_14_X],
      code: Code.fromAsset('src/layers/logger'),
      description: 'Use for logging purposes',
    });

    // 👇 layer for pushing 3rd party API details to Dynamo
    const syncLayer = new LayerVersion(this, 'sync-layer', {
      compatibleRuntimes: [Runtime.NODEJS_14_X],
      code: Code.fromAsset('src/layers/sync'),
      description: 'Fetch 3rd party details and push to dynamo',
    });

    const lambdaPolicy = new PolicyStatement();
    lambdaPolicy.addActions('dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:UpdateItem');
    lambdaPolicy.addResources(tableArn);

    // 👇 Lambda function
    this.myLambda = new NodejsFunction(this, `${this.env}-my-function`, {
      functionName: `${this.env}-my-function`,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(30),
      runtime: Runtime.NODEJS_14_X,
      handler: 'main',
      entry: path.join(__dirname, `/../src/handlers/index.ts`),
      bundling: {
        minify: false,
        externalModules: ['aws-sdk', 'winston'],
      },
      layers: [loggerLayer, syncLayer],
      initialPolicy: [lambdaPolicy],
      environment: {
        TABLE_NAME: tableName,
      },
    });

    const eventRule = new Rule(this, `${this.env}-scheduleRule`, {
      schedule: Schedule.cron({ minute: '0', hour: '0' }), // UTC Time
      ruleName: `${this.env}-scheduleRule`,
    });
    eventRule.addTarget(new LambdaFunction(this.myLambda));
  }
}
