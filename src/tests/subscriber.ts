import System from "../system/system.js";
import type { UserModel } from "../user/user.js";
import type { ConfigModel } from "../config/configTypes.js";
import DefaultSubscribe from "../subscriber/defaultSubscriber.js";

let config: ConfigModel = {userKeyEmail: ""};
const user: UserModel = {
    name: "Ndk",
    email: "ndk@gmail.con",
    id: 1,
    topics: [],
    subscribed: []
}

const handler = async (data: any) => {
    console.log("Received data: ", data);
}

const subscriber = new DefaultSubscribe(handler);
const system = new System(config);
await system.loadSystem();

let {user: currUser, rehydrateCallback} = await system.getUser();

if (currUser !== undefined) {
    await subscriber.start(currUser);
}