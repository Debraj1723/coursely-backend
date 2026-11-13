import type { PostConfirmationTriggerEvent } from "aws-lambda";

import { addDynamoItem } from "../../utils/dynamo";

export const handler = async (
  event: PostConfirmationTriggerEvent
) => {
  try {
    const { sub, email, name, phone_number } = event.request.userAttributes;

    const user = {
      userId: sub,
      email,
      name: name || "",
      mobile: phone_number || "",
      createdAt: new Date().toISOString()
    };

    await addDynamoItem("coursely-users", user);
    console.log("Student profile created successfully:", sub);
    return event;
  } catch (error) {
    console.error("Post Confirmation failed:", error);
    throw error;
  }
};