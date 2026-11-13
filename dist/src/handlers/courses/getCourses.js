"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dynamo_1 = require("../../utils/dynamo");
const constants_1 = require("../../configs/constants");
const handler = async () => {
    try {
        const courses = await (0, dynamo_1.getAllDynamoItems)(constants_1.constants.dynamoTableNames.courses);
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                data: courses
            })
        };
    }
    catch (error) {
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
exports.handler = handler;
