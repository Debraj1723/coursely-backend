"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchGetDynamoItems = exports.transactWriteDynamoItems = exports.bulkPutDynamoItems = exports.bulkDeleteDynamoItems = exports.queryDynamoItems = exports.getAllDynamoItems = exports.getDynamoItem = exports.addDynamoItem = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const constants_1 = require("../configs/constants");
// Reusable send wrapper
const sendDynamoCommand = async (command) => {
    try {
        return await constants_1.dynamodb.send(command);
    }
    catch (error) {
        console.error("DynamoDB operation failed:", error);
        throw error;
    }
};
// Add item
const addDynamoItem = async (table, obj) => {
    try {
        await sendDynamoCommand(new lib_dynamodb_1.PutCommand({
            TableName: table,
            Item: addTimestamps(obj),
        }));
    }
    catch (error) {
        console.error("Add DynamoDB item failed:", error);
        throw error;
    }
};
exports.addDynamoItem = addDynamoItem;
// Get item by primary key
const getDynamoItem = async (table, key) => {
    try {
        const params = {
            TableName: table,
            Key: key,
        };
        const res = await sendDynamoCommand(new lib_dynamodb_1.GetCommand(params));
        return res.Item ?? null;
    }
    catch (error) {
        console.error("Get DynamoDB item failed:", error);
        throw error;
    }
};
exports.getDynamoItem = getDynamoItem;
// Get all items with optional filters
const getAllDynamoItems = async (table, filters = {}) => {
    try {
        const params = {
            TableName: table,
        };
        if (Object.keys(filters).length) {
            const filterExpr = [];
            params.ExpressionAttributeNames = {};
            params.ExpressionAttributeValues = {};
            Object.entries(filters).forEach(([key, value], index) => {
                const name = `#field${index}`;
                const val = `:value${index}`;
                filterExpr.push(`${name} = ${val}`);
                params.ExpressionAttributeNames[name] = key;
                params.ExpressionAttributeValues[val] = value;
            });
            params.FilterExpression = filterExpr.join(" AND ");
        }
        const items = [];
        let lastKey;
        do {
            const page = await sendDynamoCommand(new lib_dynamodb_1.ScanCommand({
                ...params,
                ExclusiveStartKey: lastKey,
            }));
            items.push(...(page.Items ?? []));
            lastKey = page.LastEvaluatedKey;
        } while (lastKey);
        return items;
    }
    catch (error) {
        console.error("Get all DynamoDB items failed:", error);
        throw error;
    }
};
exports.getAllDynamoItems = getAllDynamoItems;
// Query items
const queryDynamoItems = async (table, keyConditionExpression, expressionAttributeNames, expressionAttributeValues) => {
    try {
        const params = {
            TableName: table,
            KeyConditionExpression: keyConditionExpression,
            ...(Object.keys(expressionAttributeNames).length > 0 && {
                ExpressionAttributeNames: expressionAttributeNames,
            }),
            ExpressionAttributeValues: expressionAttributeValues,
        };
        const res = await sendDynamoCommand(new lib_dynamodb_1.QueryCommand(params));
        return res.Items ?? [];
    }
    catch (error) {
        console.error("Query DynamoDB items failed:", error);
        throw error;
    }
};
exports.queryDynamoItems = queryDynamoItems;
// Common batch write function
const batchWriteDynamoItems = async (table, requests) => {
    for (let i = 0; i < requests.length; i += constants_1.constants.BATCH_SIZE) {
        let unprocessedItems = requests.slice(i, i + constants_1.constants.BATCH_SIZE);
        let retryCount = 0;
        while (unprocessedItems.length > 0) {
            const response = await sendDynamoCommand(new lib_dynamodb_1.BatchWriteCommand({
                RequestItems: {
                    [table]: unprocessedItems,
                },
            }));
            unprocessedItems = response.UnprocessedItems?.[table] ?? [];
            if (unprocessedItems.length > 0) {
                if (retryCount >= constants_1.constants.MAX_RETRIES) {
                    throw new Error(`Unable to process ${unprocessedItems.length} DynamoDB items`);
                }
                const delay = Math.min(100 * Math.pow(2, retryCount), 5000);
                await new Promise((resolve) => setTimeout(resolve, delay));
                retryCount++;
            }
        }
    }
};
// Bulk delete
const bulkDeleteDynamoItems = async (table, items, primaryKey) => {
    if (items.length === 0)
        return;
    const requests = items.map((item) => ({
        DeleteRequest: {
            Key: {
                [primaryKey]: item[primaryKey],
            },
        },
    }));
    await batchWriteDynamoItems(table, requests);
};
exports.bulkDeleteDynamoItems = bulkDeleteDynamoItems;
// Bulk insert / update
const bulkPutDynamoItems = async (table, items) => {
    if (items.length === 0)
        return;
    const requests = items.map((item) => ({
        PutRequest: {
            Item: addTimestamps(item),
        },
    }));
    await batchWriteDynamoItems(table, requests);
};
exports.bulkPutDynamoItems = bulkPutDynamoItems;
// Execute DynamoDB transaction
const transactWriteDynamoItems = async (transactItems) => {
    try {
        await sendDynamoCommand(new lib_dynamodb_1.TransactWriteCommand({
            TransactItems: transactItems,
        }));
    }
    catch (error) {
        console.error("DynamoDB transaction failed:", error);
        throw error;
    }
};
exports.transactWriteDynamoItems = transactWriteDynamoItems;
const addTimestamps = (item) => {
    const now = new Date().toISOString();
    return {
        ...item,
        createdAt: item.createdAt ?? now,
        updatedAt: now,
    };
};
// Get multiple items by their primary keys
const batchGetDynamoItems = async (table, keys) => {
    try {
        if (keys.length === 0)
            return [];
        const result = await sendDynamoCommand(new lib_dynamodb_1.BatchGetCommand({
            RequestItems: {
                [table]: {
                    Keys: keys,
                },
            },
        }));
        return result.Responses?.[table] ?? [];
    }
    catch (error) {
        console.error("Batch get DynamoDB items failed:", error);
        throw error;
    }
};
exports.batchGetDynamoItems = batchGetDynamoItems;
