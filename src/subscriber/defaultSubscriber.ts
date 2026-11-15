import { homedir } from "node:os";
import type { UserModel } from "../user/user.js";
import { join } from "node:path";
import { mkdir, readFile } from "node:fs/promises";
import type { StoredDefaultModel } from "../publisher/defaultPublish.js";
import { writeFile } from "node:fs/promises";
import type { AcknowledgmentModel } from "../publisher/publisher.js";
import type User from "../user/user.js";
import getUserDetail from "../utils/getUserDetails.js";

type DefaultSubscribeModel = StoredDefaultModel & {
    topic: string;
}

type MessageHandler = (data: StoredDefaultModel & {topic: string}) => Promise<void>;

class DefaultSubscribe {
    private running: boolean = false;
    private milisecondsDelay: number = 2000;

    constructor(private handler: MessageHandler) {}

    async defaultSubscriber(user: User): Promise<AcknowledgmentModel> {

        try {
            const userHomeDir: string = homedir();
            const directory: string = join(userHomeDir, ".ndkpubsub", "topics", user.user.email);
            const filepath: string = join(directory, "data.json");

            // const filepathForUserJson: string = join(userHomeDir, ".ndkpubsub", "users.json");
    
            // assuming if it subscribed then its already created data.json and have some data into it
            // but i back off and for safety added it
            await mkdir(directory, {recursive: true});
            let data: Record<string, StoredDefaultModel[]>

            try {
                let content: string = await readFile(filepath, "utf8");

                if (content.trim().length !== 0) {
                    data = JSON.parse(content)

                    const userDetails = user.getUserDetails();
                    
                    for (const subscribeTopic of userDetails.subscribed) {

                        for (const dataOfTopic of data[subscribeTopic]! ?? []) {

                            if (dataOfTopic.acknowledge) {
                                continue;
                            }
                            
                            // send data somewhere 
                            let mergedTopic = {
                                ...dataOfTopic,
                                topic: subscribeTopic
                            };

                            // callback
                            await this.handler(mergedTopic);

                            dataOfTopic.acknowledge = true;
                        }
                    }

                    let jsonDataString: string = JSON.stringify(data, null, 2);
                    await writeFile(filepath, jsonDataString, "utf8");
                }
            }
            catch(error) {
                console.log("Error: ", error);
                return {success: false};
            }

            return {success: true};
        }
        
        catch(error) {
            console.log("Error: ", error);
            return {success: false};
        }
        
    }

    async delay(ms: number) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        })
    }

    async start(user: User) {
        this.running = true;

        while (this.running) {
            console.log("CHECKING SUBSCRIBE TOPICS..");
            
            await this.delay(this.milisecondsDelay);

            let {success} = await this.defaultSubscriber(user);
            if (!success) {
                console.log("ERROR WHILE CHECKING SUBSCRIBED TOPICS..");
            }
        }
    }

    stop() {
        this.running = false;
    }
}

export default DefaultSubscribe;
export type {DefaultSubscribeModel}