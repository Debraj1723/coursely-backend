import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { getDynamoItem } from "../../utils/dynamo";
import { constants } from "../../configs/constants";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const courseId = event.pathParameters?.courseId;

    if (!courseId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "Course ID is required"
        })
      };
    }

    const course = await getDynamoItem(
      constants.dynamoTableNames.courses,
      { courseId }
    );

    if (!course) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          message: "Course not found"
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: course
      })
    };
  } catch (error) {
    console.error("Failed to fetch course:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Failed to fetch course"
      })
    };
  }
};