import * as cdk from '@aws-cdk/core';
import { UserPool } from '@aws-cdk/aws-cognito';

export class CognitoStack extends cdk.Stack {
  public readonly userPool: UserPool;
  private env: string = this.node.tryGetContext('environment');

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.userPool = new UserPool(this, `${this.env}-myUserPool`, {
      signInAliases: {
        email: true,
      },
      userPoolName: `${this.env}-myUserPool`,
    });

    this.userPool.addClient(`${this.env}-${'poolClient'}`, {
      userPoolClientName: `${this.env}-${'poolClient'}`,
      authFlows: {
        adminUserPassword: true,
        userPassword: true,
        userSrp: true,
      },
    });
  }
}
