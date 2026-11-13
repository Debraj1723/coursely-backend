
import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { getAllDynamoItems } from "../../utils/dynamo";
import { constants } from "../../configs/constants";

export const handler: APIGatewayProxyHandlerV2 = async () => {
  try {
    const courses = await getAllDynamoItems(
      constants.dynamoTableNames.courses
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: courses
      })
    };
  } catch (error) {
    console.error("Failed to fetch courses:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Failed to fetch courses"
      })
    };
  }
};
