"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dynamo_1 = require("../../utils/dynamo");
const constants_1 = require("../../configs/constants");
const handler = async (event) => {
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
        const registrations = (await (0, dynamo_1.queryDynamoItems)(constants_1.constants.dynamoTableNames.registrations, "studentId = :studentId", {}, {
            ":studentId": studentId,
        }));
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
        const courses = (await (0, dynamo_1.batchGetDynamoItems)(constants_1.constants.dynamoTableNames.courses, courseKeys));
        // 6. Create course lookup map
        const courseMap = new Map(courses.map((course) => [course.courseId, course]));
        // 7. Combine registrations with course details
        const data = registrations.map((registration) => ({
            ...registration,
            course: courseMap.get(registration.courseId) ?? null,
        }));
        // 8. Return response
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: "Registrations fetched successfully",
                data,
            }),
        };
    }
    catch (error) {
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
exports.handler = handler;
