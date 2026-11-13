import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";

import { batchGetDynamoItems, queryDynamoItems } from "../../utils/dynamo";
import { constants } from "../../configs/constants";
import { Registration } from "../../interfaces/registration";
import { Course } from "../../interfaces/course";

interface RegistrationWithCourse extends Registration {
  course: Course | null;
}

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event,
) => {
  try {
    // 1. Get authenticated student ID from Cognito
    const studentId = event.requestContext.authorizer.jwt.claims.sub;

    if (typeof studentId !== "string" || !studentId) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          message: "Unauthorized",
        }),
      };
    }

    // 2. Fetch registrations belonging to this student
    const registrations = (await queryDynamoItems(
      constants.dynamoTableNames.registrations,
      "studentId = :studentId",
      {},
      {
        ":studentId": studentId,
      },
    )) as Registration[];

    // 3. Return if no registrations exist
    if (registrations.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: "No course registrations found",
          data: [],
        }),
      };
    }

    // 4. Extract course IDs
    const courseKeys = registrations.map((registration) => ({
      courseId: registration.courseId,
    }));

    // 5. Fetch course details
    const courses = (await batchGetDynamoItems(
      constants.dynamoTableNames.courses,
      courseKeys,
    )) as Course[];

    // 6. Create course lookup map
    const courseMap = new Map<string, Course>(
      courses.map((course) => [course.courseId, course]),
    );

    // 7. Combine registrations with course details
    const data: RegistrationWithCourse[] = registrations.map(
      (registration) => ({
        ...registration,
        course: courseMap.get(registration.courseId) ?? null,
      }),
    );

    // 8. Return response
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Registrations fetched successfully",
        data,
      }),
    };
  } catch (error) {
    console.error("Fetch registrations failed:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Failed to fetch registrations",
      }),
    };
  }
};
