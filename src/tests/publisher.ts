import System from "../system/system.js";
import type { UserModel } from "../user/user.js";
import { setTimeout } from "node:timers/promises";

const user: UserModel = {
    name: "Ndk",
    email: "ndk@gmail.con",
    id: 1,
    topics: [],
    subscribed: []
}

const system = new System();
await system.loadSystem();

let {user: currUser, rehydrateCallback} = await system.getUser();

if (currUser !== undefined) {

    await currUser.publishTopic({topic: "payment"}, {"data": "brsfksnkfs"});
    await currUser.publishTopic({topic: "payment"}, {"data": "adda"});

    // wait 3 sec to verify
    await setTimeout(6000);

    await currUser.publishTopic({topic: "payment"}, {"data": "brsfksnkfs"});
    await currUser.publishTopic({topic: "payment"}, {"data": "brsfksnkfs"});
}