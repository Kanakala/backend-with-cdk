import * as cdk from '@aws-cdk/core';
import { GraphqlApi, DynamoDbDataSource, Schema, AuthorizationType, MappingTemplate } from '@aws-cdk/aws-appsync';
import { DynamoStack } from './dynamo';
import { LambdaStack } from './lambda';
import { CognitoStack } from './cognito';

export class AppSyncStack extends cdk.Stack {
  private env: string = this.node.tryGetContext('environment');
  private entityName: string = this.node.tryGetContext('entity');

  constructor(
    scope: cdk.App,
    id: string,
    dynamoStack: DynamoStack,
    lambdaStack: LambdaStack,
    cognitoStack: CognitoStack,
    props?: cdk.StackProps,
  ) {
    super(scope, id, props);

    const api = new GraphqlApi(this, `${this.env}-${this.entityName}-api`, {
      name: `${this.env}-${this.entityName}-api`,
      schema: Schema.fromAsset('src/graphql/schema.graphql'),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool: cognitoStack.userPool,
          },
        },
      },
      xrayEnabled: true,
    });

    const lambdaDatasource = api.addLambdaDataSource(`${this.env}_lambdaDatasource`, lambdaStack.myLambda, {
      name: `${this.env}_lambdaDatasource`,
      description: 'DataSource for my lambda',
    });

    lambdaDatasource.createResolver({
      typeName: 'Mutation',
      fieldName: 'syncPosts',
    });

    const dynamodbDataSource = new DynamoDbDataSource(this, `${this.env}_dynamodbDataSource`, {
      api,
      table: dynamoStack.dynamoTable,
      name: `${this.env}_dynamodbDataSource`,
      description: 'DataSource for my table',
      readOnlyAccess: true,
    });

    dynamodbDataSource.createResolver({
      typeName: 'Query',
      fieldName: 'getPost',
      requestMappingTemplate: MappingTemplate.fromString(`{
        "version": "2017-02-28",
        "operation": "GetItem",
        "key": {
          "id": $util.dynamodb.toDynamoDBJson($ctx.args.id),
          "userId": $util.dynamodb.toDynamoDBJson($ctx.args.userId),
        }
      }`),
      responseMappingTemplate: MappingTemplate.dynamoDbResultItem(),
    });

    dynamodbDataSource.createResolver({
      typeName: 'Query',
      fieldName: 'getPostById',
      requestMappingTemplate: MappingTemplate.fromString(`{
        "version" : "2017-02-28",
        "operation" : "Query",
        "query": {
          "expression": "id = :id",
          "expressionValues": {
            ":id": $util.dynamodb.toDynamoDBJson($ctx.args.id),
          }
        }
      }`),
      responseMappingTemplate: MappingTemplate.fromString(`$util.toJson($ctx.result.items[0])`),
    });

    dynamodbDataSource.createResolver({
      typeName: 'Query',
      fieldName: 'listPosts',
      requestMappingTemplate: MappingTemplate.fromString(`{
        "version": "2017-02-28",
        "operation": "Scan",
        "limit": $util.defaultIfNull($ctx.args.limit, 20),
        "nextToken": $util.toJson($util.defaultIfNullOrBlank($ctx.args.nextToken, null))
      }`),
      responseMappingTemplate: MappingTemplate.fromString(`{
        "items": $util.toJson($ctx.result.items),
        "nextToken": $util.toJson($util.defaultIfNullOrBlank($context.result.nextToken, null))
      }`),
    });

    new cdk.CfnOutput(this, 'GraphQLAPIURL', {
      value: api.graphqlUrl,
    });
  }
}
