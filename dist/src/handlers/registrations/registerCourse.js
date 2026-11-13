"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dynamo_1 = require("../../utils/dynamo");
const constants_1 = require("../../configs/constants");
const handler = async (event) => {
    try {
        // 1. Get authenticated student ID from Cognito
        const studentId = event.requestContext.authorizer?.jwt?.claims?.sub;
        if (typeof studentId !== "string" || !studentId) {
            return {
                statusCode: 401,
                body: JSON.stringify({
                    success: false,
                    message: "Unauthorized",
                }),
            };
        }
        // 2. Validate request body
        let body;
        try {
            body = JSON.parse(event.body ?? "{}");
        }
        catch {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    success: false,
                    message: "Invalid JSON request body",
                }),
            };
        }
        const courseId = body.courseId?.trim();
        if (!courseId) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    success: false,
                    message: "Course ID is required",
                }),
            };
        }
        // 3. Check whether the course exists
        const course = await (0, dynamo_1.getDynamoItem)(constants_1.constants.dynamoTableNames.courses, {
            courseId,
        });
        if (!course) {
            return {
                statusCode: 404,
                body: JSON.stringify({
                    success: false,
                    message: "Course not found",
                }),
            };
        }
        // 4. Check for existing registration
        const existingRegistration = await (0, dynamo_1.getDynamoItem)(constants_1.constants.dynamoTableNames.registrations, { studentId, courseId });
        if (existingRegistration) {
            return {
                statusCode: 409,
                body: JSON.stringify({
                    success: false,
                    message: "You are already registered for this course",
                }),
            };
        }
        // 5. Check course capacity
        if (course.bookedSlots >= course.totalSlots) {
            return {
                statusCode: 409,
                body: JSON.stringify({
                    success: false,
                    message: "Course is fully booked",
                }),
            };
        }
        // 6. Register student and increment booked slots atomically
        await (0, dynamo_1.transactWriteDynamoItems)([
            {
                Put: {
                    TableName: constants_1.constants.dynamoTableNames.registrations,
                    Item: {
                        studentId,
                        courseId,
                        registeredAt: new Date().toISOString(),
                    },
                    ConditionExpression: "attribute_not_exists(#studentId)",
                    ExpressionAttributeNames: {
                        "#studentId": "studentId",
                    },
                },
            },
            {
                Update: {
                    TableName: constants_1.constants.dynamoTableNames.courses,
                    Key: { courseId },
                    UpdateExpression: "SET #bookedSlots = #bookedSlots + :one",
                    ConditionExpression: "#bookedSlots < #totalSlots",
                    ExpressionAttributeNames: {
                        "#bookedSlots": "bookedSlots",
                        "#totalSlots": "totalSlots",
                    },
                    ExpressionAttributeValues: {
                        ":one": 1,
                    },
                },
            },
        ]);
        return {
            statusCode: 201,
            body: JSON.stringify({
                success: true,
                message: "Course registration successful",
                data: {
                    studentId,
                    courseId,
                },
            }),
        };
    }
    catch (error) {
        console.error("Course registration failed:", error);
        // Handle transaction condition failures
        if (error.name === "TransactionCanceledException") {
            return {
                statusCode: 409,
                body: JSON.stringify({
                    success: false,
                    message: "Registration could not be completed. The course may be full or you may already be registered.",
                }),
            };
        }
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                message: "Failed to register for course",
            }),
        };
    }
};
exports.handler = handler;
