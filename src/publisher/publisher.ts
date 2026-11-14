import type { TopicModel } from "../topic/topic.js";
import type { UserModel } from "../user/user.js";
// import type { UserModel } from "../user/user.js";

type AcknowledgmentModel = {
    success: boolean;
}

interface Publisher {
    defaultPublish(topic: TopicModel, data: any, user: UserModel): Promise<AcknowledgmentModel> 
}

export type {Publisher, AcknowledgmentModel};