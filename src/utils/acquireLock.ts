import { randomUUID } from "node:crypto";
import { open, readFile, unlink } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

type LockModel = {
    token: string;
    pid: number;
    timestamp: number;
}

async function acquireLock(lockFilePath: string) {
    const token = randomUUID();
    const lock: LockModel = {
        token,
        pid: process.pid,
        timestamp: Date.now()
    };

    try {
        const handle = await open(lockFilePath, "wx");

        await handle.writeFile(JSON.stringify(lock, null, 2), "utf8");
        // console.log("LOCK OPENED:", lockFilePath, "PID:", process.pid);

        return async function releaseLock(): Promise<void> {
            try {
                const content = await readFile(lockFilePath, "utf8");
                const currentLock = JSON.parse(content) as LockModel;

                if (currentLock.token === token) {
                    // console.log("LOCK CLOSING:", lockFilePath, "PID:", process.pid);
                    await unlink(lockFilePath);
                    // console.log("LOCK CLOSED:", lockFilePath);
                }
            } finally {
                await handle.close();
            }
        };
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "EEXIST") {
            console.log("LOCK BUSY:", lockFilePath);
            return undefined;
        }

        throw error;
    }
}

export default acquireLock;