import System, { type SystemUserModel } from "./system/system.js";
import type { UserModel } from "./user/user.js";
import type { ConfigModel } from "./config/configTypes.js";
import DefaultSubscribe, { type DefaultSubscribeModel } from "./subscriber/defaultSubscriber.js";
import type { StoredDefaultModel } from "./publisher/defaultPublish.js";

const config: ConfigModel = {userKeyEmail: ""};

const user: UserModel = {
    name: "Ndk",
    email: "ndk@gmail.con",
    id: 1,
    topics: [],
    subscribed: []
}

const system = new System(config);
await system.loadSystem();
await system.createUser(user);

const systemUserObject: SystemUserModel = await system.getUser();

if (systemUserObject.user !== undefined) {
    await systemUserObject.user.registerTopic({topic: "auth"});
    await systemUserObject.user.registerTopic({topic: "payments"});

    await systemUserObject.user.subscribeTopic({topic: "auth"});

    // rehydrate
    await systemUserObject.rehydrateCallback();
    
    // publish into payment
    await systemUserObject.user.publishTopic({topic: "auth"}, {from: 1, to: 2, tid: 11, amount: 100});
}

// subscriber
const handler = async (message: StoredDefaultModel & {topic: string}) => {
    console.log("Receiver: ", message);
}

 const latestSystemUser = await system.recentUser();
const subscriber = new DefaultSubscribe(handler);

if (latestSystemUser !== undefined) {
    await subscriber.defaultSubscriber(latestSystemUser);
}