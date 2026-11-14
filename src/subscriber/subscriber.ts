import type { AcknowledgmentModel } from "../publisher/publisher.js";
import type User from "../user/user.js";
import type { UserModel } from "../user/user.js";

interface Subscribe {
    defaultSubscriber(user: User): Promise<AcknowledgmentModel>
}

export type {Subscribe};