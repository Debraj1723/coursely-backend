import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// AWS configuration
const awsConfig = {
  region: "ap-south-1",
};

// Initialize DynamoDB client
const client = new DynamoDBClient(awsConfig);

// Create Document Client
const dynamodb = DynamoDBDocumentClient.from(client);

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

export { constants, dynamodb };
