import { homedir } from "node:os";
import type { TopicModel } from "../topic/topic.js";
import type { UserModel } from "../user/user.js";
import type { AcknowledgmentModel } from "./publisher.js";
import { join } from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { nanoid } from "nanoid";

type StoredDefaultModel = {
    id: string;
    data: string;
    acknowledge: boolean;
}

class DefaultPublish {
    constructor() {}

    async defaultPublish(topic: TopicModel, data: any, user: UserModel): Promise<AcknowledgmentModel> {

        try {
            const userProfileDir: string = homedir();
            const directory: string = join(userProfileDir, ".ndkpubsub", "topics", user.email);
            const filepath: string = join(directory, "data.json");
    
            await mkdir(directory, {recursive: true});

            let beforeData: Record<string, StoredDefaultModel[]> = {}; 
    
            try {
                let content: string = await readFile(filepath, "utf8");
                if (content.trim().length == 0) {
                    console.log("Empty Topics");
                }else {
                    beforeData = JSON.parse(content);
                }
            }
            catch(error) {
                if ((error as NodeJS.ErrnoException).code == "ENOENT") {
                    console.log("File Doesn't Exist.");
                } 
                else {
                    console.log("Error: ", error);
                    return {success: false};
                }
            }

            const uniqueId: string = nanoid();

            if (beforeData[topic.topic] === undefined) {
                beforeData[topic.topic] = [];
            }

            beforeData[topic.topic]?.push({id: uniqueId,data: data,acknowledge: false})
    
            let jsonString: string = JSON.stringify(beforeData, null, 2);
            await writeFile(filepath, jsonString, "utf8");
    
            return {success: true};
        }

        catch(error) {
            console.error("Publishing failed:", error);
            return {success: false};
        }
    }
}

export default DefaultPublish;
export type {StoredDefaultModel}