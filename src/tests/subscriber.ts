import { System, DefaultSubscribe } from "json-pub-sub";

const handler = async (data: any) => {
    console.log("Received data: ", data);
}

const subscriber = new DefaultSubscribe(handler);
const system = new System();
await system.loadSystem();

let {user: currUser, rehydrateCallback} = await system.getUser();

if (currUser !== undefined) {
    process.on("SIGINT", () => {
        console.log("STOPPING SUBSCRIBER RUNNING");
        subscriber.stop();
        console.log("SUSCRIBER STOPPED, BYE BY NDKPUBSUB");
    })
    
    await subscriber.start(currUser);
}
