import * as cdk from '@aws-cdk/core';
import { Table, AttributeType } from '@aws-cdk/aws-dynamodb';

export interface DynamoStackProps extends cdk.StackProps {
  tableName: string;
}

export class DynamoStack extends cdk.Stack {
  public readonly dynamoTable: Table;
  private env: string = this.node.tryGetContext('environment');

  constructor(scope: cdk.App, id: string, props: DynamoStackProps) {
    super(scope, id, props);

    const tableName = `${this.env}-${props.tableName}`;

    this.dynamoTable = new Table(this, tableName, {
      partitionKey: { name: 'id', type: AttributeType.NUMBER },
      sortKey: { name: 'userId', type: AttributeType.NUMBER },
      readCapacity: 5,
      writeCapacity: 5,
      tableName,
    });
  }
}
