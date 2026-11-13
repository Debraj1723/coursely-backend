import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";

import {
  getDynamoItem,
  transactWriteDynamoItems
} from "../../utils/dynamo";
import { constants } from "../../configs/constants";

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event) => {
  try {
    const studentId = event.requestContext.authorizer.jwt.claims.sub;
    const courseId = event.pathParameters?.courseId;

    if (!studentId || !courseId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "Student ID or Course ID is missing"
        })
      };
    }

    const registration = await getDynamoItem(
      constants.dynamoTableNames.registrations,
      { studentId, courseId }
    );

    if (!registration) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          message: "Registration not found"
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

    await transactWriteDynamoItems([
      {
        Delete: {
          TableName: constants.dynamoTableNames.registrations,
          Key: { studentId, courseId },
          ConditionExpression: "attribute_exists(studentId)"
        }
      },
      {
        Update: {
          TableName: constants.dynamoTableNames.courses,
          Key: { courseId },
          UpdateExpression: "SET bookedSlots = bookedSlots - :one",
          ConditionExpression: "bookedSlots >= :one",
          ExpressionAttributeValues: {
            ":one": 1
          }
        }
      }
    ]);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Course unregistered successfully"
      })
    };

  } catch (error: unknown) {
    console.error("Error unregistering course:", error);

    if (error instanceof Error && error.name === "TransactionCanceledException") {
      return {
        statusCode: 409,
        body: JSON.stringify({
          success: false,
          message: "Unable to unregister this course"
        })
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Internal server error"
      })
    };
  }
};