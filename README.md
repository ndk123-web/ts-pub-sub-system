# JSON Pub/Sub

A small, user-isolated publish/subscribe system built from scratch with
TypeScript and Node.js. This project is mainly for learning how publishing,
subscription, persistence, polling, acknowledgement, and file locking work
together.

## What it does

Each user has an isolated workspace:

```text
~/.ndkpubsub/
├── config.json
├── users.json
└── topics/
    └── <user-email>/
        ├── data.json
        └── config.lock
```

- A user registers topics that they own.
- A user subscribes to their registered topics.
- The publisher stores messages in the user's topic file.
- The subscriber continuously checks that file for new messages.
- A handler receives each unacknowledged message.
- A lock prevents the publisher and subscriber from writing the same file at
  the same time.

There is no external broker in this MVP. Publisher and subscriber services
work independently against the user's local JSON storage.

## Requirements

- Node.js 20 or newer
- npm

## Install from npm

In another Node.js project:

```bash
npm install json-pub-sub
```

The package exposes `System`, `User`, `DefaultPublish`, `DefaultSubscribe`,
and the related TypeScript types from its package entry point.

## Usage

Create a user only during the first setup. After that, `System` automatically
loads the saved user from `config.json` and `users.json`; you do not need to
create the user object on every run:

```ts
import { System, type UserModel } from "json-pub-sub";

const system = new System();
await system.loadSystem();

let { user } = await system.getUser();

if (user === undefined) {
  const newUser: UserModel = {
    id: 1,
    name: "Ndk",
    email: "ndk@example.com",
    topics: [],
    subscribed: []
  };

  await system.createUser(newUser);
  ({ user } = await system.getUser());
}

if (user === undefined) {
  throw new Error("Unable to load or create the user");
}
```

Register, subscribe, and publish:

```ts
await user.registerTopic({ topic: "payment" });
await user.subscribeTopic({ topic: "payment" });

await user.publishTopic(
  { topic: "payment" },
  { from: 1, to: 2, amount: 100 }
);
```

Start a subscriber with your own handler:

```ts
import { DefaultSubscribe } from "json-pub-sub";

const subscriber = new DefaultSubscribe(async (message) => {
  console.log("Received:", message);
});

process.on("SIGINT", () => {
  subscriber.stop();
});

await subscriber.start(user);
```

`start()` continuously polls the user's local topic file. Run the publisher
and subscriber in separate processes when testing them together.

### Change the active user

To change the saved user's name or email, use `changeUser()`. It updates the
user record, removes the old email key when the email changes, updates
`config.json`, and keeps the existing in-memory `User` reference current:

```ts
await system.changeUser({
  id: 1,
  name: "New Name",
  email: "new@example.com",
  topics: [],
  subscribed: []
});
```

## Important edge cases

### First run

On the first run, `config.json` and `users.json` may not exist. Call
`loadSystem()` first, then call `createUser()` only when `getUser()` returns
`undefined`:

```text
loadSystem()
→ no saved user
→ createUser()
→ users.json is written
→ config.json is written
→ user is loaded into memory
```

On later runs, call only `loadSystem()` and `getUser()`. The saved user is
loaded automatically.

### Creating a user more than once

`createUser()` is for initial setup. If a user is already loaded, it returns
`false` and asks you to use `changeUser()` instead. This prevents accidentally
creating a second active profile through the normal startup flow.

### Invalid user input

`createUser()` and `changeUser()` reject:

- an empty or whitespace-only name
- an empty email
- an email that does not match the basic `name@domain.tld` format

They return `false` and do not update the saved user.

### Changing an email or profile

Use `changeUser()` instead of calling `createUser()` with a different email.
The old email key is removed from `users.json`, the new key is written, and
`config.json` points to the new email.

Pass the complete desired profile to `changeUser()`. If you pass empty
`topics` or `subscribed` arrays, those arrays replace the previous values.

### Missing or empty topic files

The publisher creates the user's topic directory and `data.json` when needed.
The subscriber expects the topic file to exist; if it is missing or unreadable,
that polling cycle returns an unsuccessful acknowledgement and the continuous
subscriber can try again on its next cycle.

An empty JSON file is treated as having no messages. A malformed JSON file is
reported as an error and should be repaired or restored before retrying.

### Topic registration and subscription

A topic must be registered before subscribing to it:

```ts
await user.registerTopic({ topic: "payment" });
await user.subscribeTopic({ topic: "payment" });
```

The current MVP does not deduplicate repeated registrations or subscriptions.
Calling either method repeatedly can add duplicate entries, so applications
should avoid repeating setup calls or add their own checks.

### Lock contention

Publisher and subscriber use the same per-user `config.lock` file while
reading and writing `data.json`:

```text
lock acquired
→ read data.json
→ process or append data
→ write data.json
→ lock released
```

If another process owns the lock, the operation returns unsuccessful. The
subscriber retries during its next polling cycle. The lock is short-lived and
normally exists only during the file operation, so it may disappear before
you inspect the directory.

### Process crash while holding a lock

The lock is released in a `finally` block when the process exits normally or
throws an error. A forced process termination, crash, or power failure can
leave `config.lock` behind. The current MVP does not automatically recover
stale locks, so a stale lock may need to be removed manually before retrying.

Do not delete a lock while another publisher or subscriber is actively using
the file.

### Message acknowledgement

Only unacknowledged messages are sent to the handler. A message is marked
`acknowledge: true` after the handler completes successfully. If the handler
throws, the message is not successfully completed and the operation reports
an error instead of treating the message as handled.

### Stopping the subscriber

`start()` is a continuous polling loop. It does not finish by itself:

```ts
process.on("SIGINT", () => {
  subscriber.stop();
});
```

Press `Ctrl+C` to trigger the handler. The current polling operation may
finish before the loop stops.

### Per-user isolation

Each user's messages are stored under that user's email:

```text
~/.ndkpubsub/topics/<user-email>/data.json
```

A subscriber receives only the topics listed in that user's `subscribed`
array. This is local isolation, not authentication or security; another
process with filesystem access can still read the files.

## Install and build from source

Clone the repository and install dependencies:

```bash
git clone https://github.com/ndk123-web/ts-pub-sub-system.git
cd ts-pub-sub-system
npm install
npm run build
```

To inspect the files that will be included in the npm package:

```bash
npm pack --dry-run
```

## Run the example

The repository includes two separate processes under `src/tests/`. Start the
subscriber in one terminal:

```bash
npm run start:subscriber
```

Then start the publisher in another terminal:

```bash
npm run start:publisher
```

### `src/tests/subscriber.ts`

```ts
import System from "../system/system.js";
import type { UserModel } from "../user/user.js";
import DefaultSubscribe from "../subscriber/defaultSubscriber.js";

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
```

### `src/tests/publisher.ts`

```ts
import System from "../system/system.js";
import type { UserModel } from "../user/user.js";
import type { ConfigModel } from "../config/configTypes.js";
import { setTimeout } from "node:timers/promises";

let config: ConfigModel = {userKeyEmail: ""};
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
```

The subscriber polls every two seconds. It prints received messages through
its handler and marks successfully handled messages as acknowledged. The
publisher sends two messages, waits six seconds, and sends two more.

Stop the subscriber with `Ctrl+C`.

## Available scripts

| Script | Description |
| --- | --- |
| `npm run build` | Compile TypeScript into `dist/` |
| `npm run dev` | Run the main example with `tsx` watch mode |
| `npm run start:publisher` | Run the publisher example |
| `npm run start:subscriber` | Run the subscriber example |

## Design notes

`Publisher` is represented by an interface, so the storage strategy can be
replaced later with another implementation. The current default implementation
uses local JSON files.

This is a local learning project, not a production message broker. It does
not currently provide network communication, distributed coordination,
durable queues, authentication, or a database-backed storage layer.

## License

MIT
