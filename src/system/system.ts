import { join } from "node:path";
import { homedir } from "node:os";
import type { ConfigModel } from "../config/configTypes.js";
import type { UserModel } from "../user/user.js";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import type { AcknowledgmentModel } from "../publisher/publisher.js";
import User from "../user/user.js";
import getUserDetail from "../utils/getUserDetails.js";

type SystemUserModel = {
    user: User | undefined;
    rehydrateCallback: () => Promise<void>;
}

class System {
    private user?: User | undefined;

    constructor(private config: ConfigModel = {userKeyEmail: ""}) {}

    private normalizeUser(user: UserModel): UserModel | undefined {
        const email = user.email.trim();
        const name = user.name.trim();

        if (name.length === 0 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return undefined;
        }

        return {...user, name, email};
    }

    async loadSystem() {
        console.log("Welcome To PUB SUB System");
        console.log("Loading NdkPubSub Config");

        let {success} = await this.loadConfig();
        if (success) {
            console.log("Loaded Config.")
            // console.log("Config: ", this.config);
        }

        let userDetailModel: UserModel | undefined = await getUserDetail(this.config.userKeyEmail);
        
        if (userDetailModel !== undefined) {
            if (this.user !== undefined) {
                this.user.updateDetails(userDetailModel);
            }
            else {
                this.user = new User(userDetailModel);
            }
            console.log("User Created In Memory");
        }
    }

    async loadConfig(): Promise<AcknowledgmentModel> {
        const userProfileHome: string = homedir();
        const directory: string = join(userProfileHome, ".ndkpubsub");
        const filepath: string = join(directory, "config.json");

        await mkdir(directory, {recursive: true});

        let initialConfig: ConfigModel = {userKeyEmail: ""};

        try {
            console.log("Loaded Config In Memory.");
            // console.log("Config: ", this.config);

            let content: string = await readFile(filepath, "utf8");
            initialConfig = JSON.parse(content);
            this.config = initialConfig;

            return {success: true}
        }
        catch(error) {
            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                console.log("File Doesn't Exist.");
            } else {
                console.log("Couldn't Read Config:", error);
            } 
            return {success: false};
        }
    }

    async updateConfig(config: ConfigModel): Promise<AcknowledgmentModel> {
        const userProfileHome: string = homedir();
        const directory: string = join(userProfileHome, ".ndkpubsub");
        const filepath: string = join(directory, "config.json");

        await mkdir(directory, {recursive: true});

        let initialConfig: ConfigModel = {userKeyEmail: ""};

        try {
            let content: string = await readFile(filepath, "utf8");
            initialConfig = JSON.parse(content);
        }
        catch(error) {
            if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
                    console.log("Couldn't Get the File.");
            }
        }

        initialConfig = config;
        let jsonString: string = JSON.stringify(initialConfig, null, 2);
        
        console.log("Updating Config.");
        await writeFile(filepath, jsonString, "utf8");
        console.log("Updated Config.");
        
        return {success: true};
    }

    async createFileAndAddData(user: UserModel): Promise<boolean> {

        try {
            const userProfileHome: string = homedir();
            const directory: string = join(userProfileHome, ".ndkpubsub");
            const filepath: string = join(directory, "users.json");
    
            await mkdir(directory, {recursive: true});
            
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
            
            data[user.email] = user;
    
            const dataToWrite = JSON.stringify(data, null, 2);
    
            await writeFile(filepath, dataToWrite, "utf8");
            
            return true; 
        }
        catch(error) {
            console.log(error)
            return false;
        }
    }

    async createUser(user: UserModel): Promise<boolean> {
        const normalizedUser = this.normalizeUser(user);
        if (normalizedUser === undefined) {
            console.error("Invalid user. Provide a name and a valid email address.");
            return false;
        }

        if (this.user !== undefined) {
            console.error("A user already exists. Use changeUser() to change the active user.");
            return false;
        }

        console.log("Creating User For NdkPubSub..");
        
        // add details inside data/users.json
        let success: boolean = await this.createFileAndAddData(normalizedUser);
        
        if (!success) {
            console.log("User Creation Failed.");
            return false;
        }
        else {
            console.log("User Created.");

            let {success} = await this.updateConfig({userKeyEmail: normalizedUser.email});
            if (!success)
                console.log("Config Updation Failed.");
            else {
                console.log("Config Updated.");
                await this.rehydrate();
            }
        }

        return true;
    }

    async changeUser(user: UserModel): Promise<boolean> {
        const normalizedUser = this.normalizeUser(user);
        if (normalizedUser === undefined) {
            console.error("Invalid user. Provide a name and a valid email address.");
            return false;
        }

        const activeUser = this.user;
        if (activeUser === undefined) {
            return this.createUser(normalizedUser);
        }
        const currentUser = activeUser.getUserDetails();

        try {
            const directory = join(homedir(), ".ndkpubsub");
            const filepath = join(directory, "users.json");
            let data: Record<string, UserModel> = {};

            try {
                const content = await readFile(filepath, "utf8");
                if (content.trim().length !== 0) {
                    data = JSON.parse(content) as Record<string, UserModel>;
                }
            } catch (error) {
                if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
                    throw error;
                }
            }

            delete data[currentUser.email];
            data[normalizedUser.email] = normalizedUser;

            await writeFile(filepath, JSON.stringify(data, null, 2), "utf8");

            const configResult = await this.updateConfig({
                userKeyEmail: normalizedUser.email
            });
            if (!configResult.success) {
                return false;
            }
            
            activeUser.updateDetails(normalizedUser);
            return true;
        } catch (error) {
            console.error("Failed to change user:", error);
            return false;
        }
    }

    async rehydrate() {
        console.log("Rehydrating System..");
        await this.loadSystem();
    }

    async getUser() : Promise<SystemUserModel> {
        return {user: this.user, rehydrateCallback: async () => {await this.rehydrate()}};
    }

    async recentUser(): Promise<User | undefined> {
        await this.rehydrate();
        return this.user;
    }
}

export default System;
export type {SystemUserModel};