"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dynamo_1 = require("../../utils/dynamo");
const constants_1 = require("../../configs/constants");
const handler = async (event) => {
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
        const registration = await (0, dynamo_1.getDynamoItem)(constants_1.constants.dynamoTableNames.registrations, { studentId, courseId });
        if (!registration) {
            return {
                statusCode: 404,
                body: JSON.stringify({
                    success: false,
                    message: "Registration not found"
                })
            };
        }
        const course = await (0, dynamo_1.getDynamoItem)(constants_1.constants.dynamoTableNames.courses, { courseId });
        if (!course) {
            return {
                statusCode: 404,
                body: JSON.stringify({
                    success: false,
                    message: "Course not found"
                })
            };
        }
        await (0, dynamo_1.transactWriteDynamoItems)([
            {
                Delete: {
                    TableName: constants_1.constants.dynamoTableNames.registrations,
                    Key: { studentId, courseId },
                    ConditionExpression: "attribute_exists(studentId)"
                }
            },
            {
                Update: {
                    TableName: constants_1.constants.dynamoTableNames.courses,
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
    }
    catch (error) {
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
exports.handler = handler;
