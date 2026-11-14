import { homedir } from "node:os";
import type { UserModel } from "../user/user.js";
import { join } from "node:path";
import { readFile } from "node:fs/promises";
// import type User from "../user/user.js";
// import { emit } from "node:cluster";


async function getUserDetail(userEmail: string): Promise<UserModel | undefined> {
    const userHomeProfile = homedir();
    const directory = join(userHomeProfile, ".ndkpubsub");
    const filepath = join(directory, "users.json");

    // assuming already .ndkpubsub is there

    let content: string = await readFile(filepath, "utf8");
    let data: Record<string, UserModel> = {};
    
    try {
        const content: string = await readFile(filepath, "utf8");
        data = JSON.parse(content) 
    }
    catch(error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
            console.log("Couldn't Get the File.");
        }
    }

    if (Object.hasOwn(data, userEmail)) {
        return data[userEmail];
    }

    return undefined;
}

export default getUserDetail;