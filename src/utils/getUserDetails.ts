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

    let data: Record<string, UserModel> = {};
    
    try {
        const content: string = await readFile(filepath, "utf8");
        if (content.trim().length !== 0) {
            data = JSON.parse(content) as Record<string, UserModel>;
        }
    }
    catch(error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            return undefined;
        }
        throw error;
    }

    if (Object.hasOwn(data, userEmail)) {
        return data[userEmail];
    }

    return undefined;
}

export default getUserDetail;