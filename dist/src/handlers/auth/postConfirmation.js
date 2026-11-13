"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dynamo_1 = require("../../utils/dynamo");
const handler = async (event) => {
    try {
        const { sub, email, name, phone_number } = event.request.userAttributes;
        const user = {
            userId: sub,
            email,
            name: name || "",
            mobile: phone_number || "",
            createdAt: new Date().toISOString()
        };
        await (0, dynamo_1.addDynamoItem)("coursely-users", user);
        console.log("Student profile created successfully:", sub);
        return event;
    }
    catch (error) {
        console.error("Post Confirmation failed:", error);
        throw error;
    }
};
exports.handler = handler;
