/**
 * Follow src/tests/
 *                  publisher.ts
 *                  subscriber.ts 
 */

import System from "./system/system.js";
import User from "./user/user.js";
import DefaultPublish from "./publisher/defaultPublish.js";
import DefaultSubscribe from "./subscriber/defaultSubscriber.js";
import type { UserModel } from "./user/user.js";

export {System, User, DefaultPublish, DefaultSubscribe};
export type {UserModel}


// import System, { type SystemUserModel } from "./system/system.js";
// import type { UserModel } from "./user/user.js";
// import type { ConfigModel } from "./config/configTypes.js";
// import DefaultSubscribe, { type DefaultSubscribeModel } from "./subscriber/defaultSubscriber.js";
// // import type { StoredDefaultModel } from "./publisher/defaultPublish.js";

// // const config: ConfigModel = {userKeyEmail: ""};

// // const user: UserModel = {
// //     name: "Ndk",
// //     email: "ndk@gmail.con",
// //     id: 1,
// //     topics: [],
// //     subscribed: []
// // }

// // const system = new System(config);
// // await system.loadSystem();
// // await system.createUser(user);

// // let {user: currUser, rehydrateCallback} = await system.getUser();

// // await currUser?.registerTopic({topic: "payment"});

// // await currUser?.publishTopic({topic: "payment"}, {d1: "d1"});
// // await currUser?.publishTopic({topic: "payment"}, {d2: "d2"});

// // await currUser?.subscribeTopic({topic: "payment"});

// // const handler = async (data: any) => {
// //     console.log("data received: ", data);
// // }

// // await rehydrateCallback();

// // const subscriber = new DefaultSubscribe(handler);
// // if (currUser !== undefined) {
// //     subscriber.defaultSubscriber(currUser);
// // }