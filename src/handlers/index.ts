// 👇 using logger layer
import { logger } from '/opt/nodejs/logger';
// 👇 using sync layer
import { Post } from '/opt/nodejs/sync';

type AppSyncEvent = {
  info: {
    fieldName: string;
  };
  arguments: {
    postId: string;
  };
};

type EventBridge = {
  'detail-type': string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function main(event: AppSyncEvent & EventBridge): Promise<any> {
  try {
    logger.info(`event: ${JSON.stringify(event)}`);
    const post = new Post();
    if (event['detail-type'] === 'Scheduled Event') {
      return await post.syncLiveDataToDynamo();
    } else {
      switch (event.info.fieldName) {
        case 'syncPosts':
          return await post.syncLiveDataToDynamo();
        default:
          return null;
      }
    }
  } catch (err) {
    logger.error(`err: ${err}`);
    throw err;
  }
}
