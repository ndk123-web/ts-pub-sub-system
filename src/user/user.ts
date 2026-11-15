import { homedir } from "node:os";
import DefaultPublish from "../publisher/defaultPublish.js";
import type { Publisher, AcknowledgmentModel } from "../publisher/publisher.js";
import type { TopicModel } from "../topic/topic.js";
import { join } from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";

type UserModel = {
    id: number;
    name: string;
    email: string;
    topics: string[];
    subscribed: string[];
}

class User {
    constructor(public user: UserModel, private publisher: Publisher = new DefaultPublish()) {}
    
    async registerTopic(topic: TopicModel): Promise<AcknowledgmentModel> {

        try {
            const userProfileDir = homedir();          
            const directory = join(userProfileDir, ".ndkpubsub");
            const filePath = join(directory, "users.json");
    
            await mkdir(directory, {recursive: true});
    
            let data: Record<string, UserModel> = {};
    
            try {
                let content: string = await readFile(filePath, "utf8");
                data = JSON.parse(content);
    
                if (Object.hasOwn(data, this.user.email)) {
                    data[this.user.email]?.topics.push(topic.topic);
                    let jsonString: string = JSON.stringify(data, null, 2);
                    await writeFile(filePath, jsonString, "utf8");

                    console.log("Added Payment Topic in User Topic");
                }
            }
            catch(error) {
                console.log("error ", error);
                return {success: false};
            }
            
            return {success: true};
        }

        catch(error) {
            return {success: false};
        }
    }

    async publishTopic(topic: TopicModel, data: any): Promise<AcknowledgmentModel> {
        try {
            console.log("Publishing topic...")
            let {success} = await this.publisher.defaultPublish(topic, data, this.user);
            if (!success) {
                console.log("Error while Publishing");
                return {success: false}
            }
            
            else {
                console.log("Published");
                return {success: true}
            }
        }

        catch(error) {
            console.log("Error: ", error);
            return {success: false};
        }

    }

    async subscribeTopic(topic: TopicModel): Promise<AcknowledgmentModel> {
        try {
            const userProfileDir = homedir();          
            const directory = join(userProfileDir, ".ndkpubsub");
            const filePath = join(directory, "users.json");
    
            await mkdir(directory, {recursive: true});
    
            let data: Record<string, UserModel> = {};
    
            try {
                let content: string = await readFile(filePath, "utf8");
                data = JSON.parse(content);
    
                if (Object.hasOwn(data, this.user.email)) {

                    // validate 
                    if (data[this.user.email]?.topics.includes(topic.topic)) {
                        data[this.user.email]?.subscribed.push(topic.topic);
                        let jsonString: string = JSON.stringify(data, null, 2);
                        await writeFile(filePath, jsonString, "utf8");
    
                        console.log("Added Payment Topic in User Topic");
                    }

                    else {
                        console.error("- Register the Topic First: ", topic.topic);
                    }

                }
            }
            catch(error) {
                console.log("error ", error);
                return {success: false};
            }
            
            return {success: true};
        }

        catch(error) {
            return {success: false};
        }
    }

    updateDetails(user: UserModel) {
        this.user = user;
    }

    getUserDetails() {
        return this.user;
    }
}

export type {UserModel};
export default User;