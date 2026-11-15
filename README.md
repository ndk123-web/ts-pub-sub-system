MY IDEA IS:

1. User Isolated Pub Sub System
    - `User A` `publish` and `User A` only can get `subscribed topi`c from `User A topics not others`
    - No need to create User again and again only first time need to create and then it will add it to the .ndkpubsub/config.json, so u wont need to create User Model again and again 

2. `There is No Broker`, 
    - `Just 2 services , running Independantly`
    - information which is below:

3. two components
    - Publisher: Each user can `publish`
    - Subscriber: Each User can `subscriber` to `their own topic`

4. DefaultPublish and DefaultSubscribe
    - I have Default Publisher , Subscriber, which uses `DISK` to write data into user workspace, usually in .ndkpubsub/topics/email/data.json
    - because in future if i want different approach in furute to store user topic data, then i can just create new Publisher and subsequence Subscriber to handle it.
    - Primarily Default Publish and Subscribe store data in .json format, and isolated per user , because i just wanted the MVP that from one end can publish topic and from other end can subscribed topic's data. 

5. DefaultSubscribe
    - it uses continuous loop which is control by
    `this.running` property inside DefaultSubscribe.
    - it uses `relaxation of 2 second`s , and after each 2 periodic 2 seconds it will check data from user worksapce , subscribed topics.

6. testing
    - Look over `src/tests/` inside that there is 
    `publisher.ts` and `subscriber.ts`

7. Subscriber Handler
    - devloper need to assign `handler function` when creating object of `Subscriber`
    - using that `handler function` all data you can get that and can do various operations on that data, like storing data into database, or send to other service .. whatever it is. 