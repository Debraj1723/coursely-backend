"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamodb = exports.constants = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
// AWS configuration
const awsConfig = {
    region: "ap-south-1",
};
// Initialize DynamoDB client
const client = new client_dynamodb_1.DynamoDBClient(awsConfig);
// Create Document Client
const dynamodb = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
exports.dynamodb = dynamodb;
// Application constants
const constants = {
    region: awsConfig.region,
    saltRounds: 12,
    BATCH_SIZE: 25,
    MAX_RETRIES: 8,
    dynamoTableNames: {
        courses: "coursely-courses",
        registrations: "coursely-registrations",
    },
};
exports.constants = constants;
