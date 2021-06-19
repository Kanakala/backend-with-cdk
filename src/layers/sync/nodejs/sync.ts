import Joi from 'joi';
import AWS from 'aws-sdk';
import fetch from 'node-fetch';
import { logger } from '/opt/nodejs/logger';

const dynamoDBClient = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.TABLE_NAME as string;

export const insertValidation = Joi.object().keys({
  id: Joi.number().required(),
  userId: Joi.number().required(),
  title: Joi.string().required(),
  body: Joi.string().required(),
  createdAt: Joi.string().required(),
  updatedAt: Joi.string().required(),
});

export class IPost {
  id: string;
  userId: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: string;
  constructor(params: IPost, isCreate = false) {
    this.id = params.id;
    this.userId = params.userId;
    this.title = params.title;
    this.body = params.body;
    this.createdAt = isCreate === true ? new Date().toISOString() : params.createdAt;
    this.updatedAt = new Date().toISOString();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const returnJoiErr = (error: any) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errorDetails = error.details.map((detailObject: any) => detailObject.message);
  const stringErr = errorDetails.join(', ').replace(/[`~!@#$%^&*()|+=?;:'"<>{}[\]\\]/gi, '');
  logger.info(`stringErr is: ${stringErr}`);
  return stringErr;
};

export class Post {
  private async getPost(id: string, userId: string): Promise<IPost> {
    try {
      if (!id || !userId) {
        throw Error('Please provide postId and userId');
      }
      const params: AWS.DynamoDB.DocumentClient.GetItemInput = {
        TableName,
        Key: {
          id,
          userId,
        },
      };

      logger.info(`getParams: ${JSON.stringify(params)}`);

      const data = await dynamoDBClient.get(params).promise();
      return data.Item as unknown as IPost;
    } catch (err) {
      throw err;
    }
  }

  private async addPost(request: IPost): Promise<IPost> {
    try {
      const newPost = new IPost(request, true);
      logger.info(`newPost: ${JSON.stringify(newPost)}`);
      insertValidation.validateAsync(newPost).catch((error) => {
        if (error && error.details) {
          logger.error(`Error :${error.details}`);
          throw Error(returnJoiErr(error));
        }
      });

      const params: AWS.DynamoDB.DocumentClient.PutItemInput = {
        TableName,
        Item: newPost,
      };

      await dynamoDBClient.put(params).promise();
      return newPost;
    } catch (err) {
      throw err;
    }
  }

  private async updatePost(request: IPost): Promise<IPost> {
    try {
      const { id, userId } = request;
      if (!id || !userId) {
        throw Error('Please provide postId and userId');
      }
      const postToUpdate: IPost = new IPost(request);

      insertValidation.validateAsync(postToUpdate).catch((error) => {
        if (error && error.details) {
          logger.error(`Error :${error.details}`);
          throw Error(returnJoiErr(error));
        }
      });
      delete postToUpdate.id;
      delete postToUpdate.userId;
      const params = {
        ExpressionAttributeNames: Object.keys(postToUpdate).reduce((obj, key) => ({ ...obj, [`#${key}`]: key }), {}),
        ExpressionAttributeValues: Object.keys(postToUpdate).reduce(
          (obj, key) => ({ ...obj, [`:${key}`]: postToUpdate[`${key}`] }),
          {},
        ),
        Key: {
          id,
          userId,
        },
        ReturnValues: 'ALL_NEW',
        TableName,
        UpdateExpression: `SET ${Object.keys(postToUpdate)
          .map((key) => `#${key} = :${key}`)
          .join(', ')}`,
      };
      logger.info(`params: ${JSON.stringify(params)}`);

      const data = await dynamoDBClient.update(params).promise();
      return data.Attributes as unknown as IPost;
    } catch (err) {
      throw err;
    }
  }

  private async processPost(request: IPost): Promise<IPost> {
    try {
      const { id, userId } = request;
      const existingItem = await this.getPost(id, userId);
      if (!existingItem) {
        return this.addPost(request);
      } else {
        request.createdAt = existingItem.createdAt;
        return this.updatePost(request);
      }
    } catch (err) {
      throw err;
    }
  }

  private async getLiveItems(): Promise<IPost[]> {
    try {
      const data = (await fetch('https://jsonplaceholder.typicode.com/posts').then((res) =>
        res.json(),
      )) as unknown as IPost[];
      return data;
    } catch (err) {
      throw err;
    }
  }

  public async syncLiveDataToDynamo(): Promise<IPost[]> {
    try {
      const data: IPost[] = await this.getLiveItems();
      logger.info(`data: ${JSON.stringify(data)}`);
      const processedData = await Promise.all(data.map(async (post: IPost) => this.processPost(post)));
      logger.info(`processedData: ${JSON.stringify(processedData)}`);
      return processedData;
    } catch (err) {
      throw err;
    }
  }
}
