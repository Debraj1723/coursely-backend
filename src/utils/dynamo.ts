import {
  PutCommand,
  GetCommand,
  ScanCommand,
  QueryCommand,
  BatchWriteCommand,
  TransactWriteCommand,
  BatchGetCommand,
} from "@aws-sdk/lib-dynamodb";

import type { ScanCommandInput } from "@aws-sdk/lib-dynamodb";

import { constants, dynamodb } from "../configs/constants";

// Reusable send wrapper
const sendDynamoCommand = async (command: any): Promise<any> => {
  try {
    return await dynamodb.send(command);
  } catch (error) {
    console.error("DynamoDB operation failed:", error);
    throw error;
  }
};

// Add item
export const addDynamoItem = async (
  table: string,
  obj: Record<string, any>,
) => {
  try {
    await sendDynamoCommand(
      new PutCommand({
        TableName: table,
        Item: addTimestamps(obj),
      }),
    );
  } catch (error) {
    console.error("Add DynamoDB item failed:", error);
    throw error;
  }
};

// Get item by primary key
export const getDynamoItem = async (
  table: string,
  key: Record<string, any>,
) => {
  try {
    const params = {
      TableName: table,
      Key: key,
    };

    const res = await sendDynamoCommand(new GetCommand(params));

    return res.Item ?? null;
  } catch (error) {
    console.error("Get DynamoDB item failed:", error);
    throw error;
  }
};

// Get all items with optional filters
export const getAllDynamoItems = async (
  table: string,
  filters: Record<string, any> = {},
) => {
  try {
    const params: ScanCommandInput = {
      TableName: table,
    };

    if (Object.keys(filters).length) {
      const filterExpr: string[] = [];

      params.ExpressionAttributeNames = {};
      params.ExpressionAttributeValues = {};

      Object.entries(filters).forEach(([key, value], index) => {
        const name = `#field${index}`;
        const val = `:value${index}`;

        filterExpr.push(`${name} = ${val}`);

        params.ExpressionAttributeNames![name] = key;
        params.ExpressionAttributeValues![val] = value;
      });

      params.FilterExpression = filterExpr.join(" AND ");
    }

    const items: Record<string, any>[] = [];
    let lastKey: Record<string, any> | undefined;

    do {
      const page = await sendDynamoCommand(
        new ScanCommand({
          ...params,
          ExclusiveStartKey: lastKey,
        }),
      );

      items.push(...(page.Items ?? []));
      lastKey = page.LastEvaluatedKey;
    } while (lastKey);

    return items;
  } catch (error) {
    console.error("Get all DynamoDB items failed:", error);
    throw error;
  }
};

// Query items
export const queryDynamoItems = async (
  table: string,
  keyConditionExpression: string,
  expressionAttributeNames: Record<string, string>,
  expressionAttributeValues: Record<string, any>,
) => {
  try {
    const params = {
      TableName: table,
      KeyConditionExpression: keyConditionExpression,
      ...(Object.keys(expressionAttributeNames).length > 0 && {
        ExpressionAttributeNames: expressionAttributeNames,
      }),
      ExpressionAttributeValues: expressionAttributeValues,
    };

    const res = await sendDynamoCommand(new QueryCommand(params));

    return res.Items ?? [];
  } catch (error) {
    console.error("Query DynamoDB items failed:", error);
    throw error;
  }
};

// Common batch write function
const batchWriteDynamoItems = async (
  table: string,
  requests: any[],
): Promise<void> => {
  for (let i = 0; i < requests.length; i += constants.BATCH_SIZE) {
    let unprocessedItems = requests.slice(i, i + constants.BATCH_SIZE);
    let retryCount = 0;

    while (unprocessedItems.length > 0) {
      const response = await sendDynamoCommand(
        new BatchWriteCommand({
          RequestItems: {
            [table]: unprocessedItems,
          },
        }),
      );

      unprocessedItems = response.UnprocessedItems?.[table] ?? [];

      if (unprocessedItems.length > 0) {
        if (retryCount >= constants.MAX_RETRIES) {
          throw new Error(
            `Unable to process ${unprocessedItems.length} DynamoDB items`,
          );
        }

        const delay = Math.min(100 * Math.pow(2, retryCount), 5000);

        await new Promise((resolve) => setTimeout(resolve, delay));

        retryCount++;
      }
    }
  }
};

// Bulk delete
export const bulkDeleteDynamoItems = async (
  table: string,
  items: Record<string, any>[],
  primaryKey: string,
): Promise<void> => {
  if (items.length === 0) return;

  const requests = items.map((item) => ({
    DeleteRequest: {
      Key: {
        [primaryKey]: item[primaryKey],
      },
    },
  }));

  await batchWriteDynamoItems(table, requests);
};

// Bulk insert / update
export const bulkPutDynamoItems = async (
  table: string,
  items: Record<string, any>[],
): Promise<void> => {
  if (items.length === 0) return;

  const requests = items.map((item) => ({
    PutRequest: {
      Item: addTimestamps(item),
    },
  }));

  await batchWriteDynamoItems(table, requests);
};

// Execute DynamoDB transaction
export const transactWriteDynamoItems = async (
  transactItems: any[],
): Promise<void> => {
  try {
    await sendDynamoCommand(
      new TransactWriteCommand({
        TransactItems: transactItems,
      }),
    );
  } catch (error) {
    console.error("DynamoDB transaction failed:", error);
    throw error;
  }
};

const addTimestamps = (item: any) => {
  const now = new Date().toISOString();

  return {
    ...item,
    createdAt: item.createdAt ?? now,
    updatedAt: now,
  };
};

// Get multiple items by their primary keys
export const batchGetDynamoItems = async (
  table: string,
  keys: Record<string, any>[],
): Promise<Record<string, any>[]> => {
  try {
    if (keys.length === 0) return [];

    const result = await sendDynamoCommand(
      new BatchGetCommand({
        RequestItems: {
          [table]: {
            Keys: keys,
          },
        },
      }),
    );

    return result.Responses?.[table] ?? [];
  } catch (error) {
    console.error("Batch get DynamoDB items failed:", error);
    throw error;
  }
};
