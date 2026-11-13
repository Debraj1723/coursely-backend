"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dynamo_1 = require("../../utils/dynamo");
const courses_1 = require("../../jsons/courses");
const constants_1 = require("../../configs/constants");
const handler = async () => {
    try {
        // 1. Fetch courses with zero registrations
        const coursesToDelete = await (0, dynamo_1.getAllDynamoItems)(constants_1.constants.dynamoTableNames.courses, { bookedSlots: 0 });
        // 2. Bulk delete unregistered courses
        await (0, dynamo_1.bulkDeleteDynamoItems)(constants_1.constants.dynamoTableNames.courses, coursesToDelete, "courseId");
        // 4. Bulk insert/update courses
        await (0, dynamo_1.bulkPutDynamoItems)(constants_1.constants.dynamoTableNames.courses, courses_1.courses);
        // 5. Return synchronization summary
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: "Course catalogue synchronized successfully",
                summary: {
                    deletedCourses: coursesToDelete.length,
                    processedCourses: courses_1.courses.length,
                },
            }),
        };
    }
    catch (error) {
        console.error("Course synchronization failed:", error);
        throw error;
    }
};
exports.handler = handler;
