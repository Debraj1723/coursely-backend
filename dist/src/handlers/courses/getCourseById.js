"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dynamo_1 = require("../../utils/dynamo");
const constants_1 = require("../../configs/constants");
const handler = async (event) => {
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
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                data: course
            })
        };
    }
    catch (error) {
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
exports.handler = handler;
