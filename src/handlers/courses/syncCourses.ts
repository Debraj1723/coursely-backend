import {
  getAllDynamoItems,
  bulkDeleteDynamoItems,
  bulkPutDynamoItems,
} from "../../utils/dynamo";

import { courses } from "../../jsons/courses";
import { constants } from "../../configs/constants";

export const handler = async () => {
  try {
    // 1. Fetch courses with zero registrations
    const coursesToDelete = await getAllDynamoItems(
      constants.dynamoTableNames.courses,
      { bookedSlots: 0 },
    );

    // 2. Bulk delete unregistered courses
    await bulkDeleteDynamoItems(
      constants.dynamoTableNames.courses,
      coursesToDelete,
      "courseId",
    );

    // 4. Bulk insert/update courses
    await bulkPutDynamoItems(constants.dynamoTableNames.courses, courses);

    // 5. Return synchronization summary
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Course catalogue synchronized successfully",
        summary: {
          deletedCourses: coursesToDelete.length,
          processedCourses: courses.length,
        },
      }),
    };
  } catch (error) {
    console.error("Course synchronization failed:", error);
    throw error;
  }
};
