import "reflect-metadata";
import { Application, container } from "./app"
import { Database } from "./utils";

(async (): Promise<void> => {
    if (!await databaseHealthCheck()) {
        process.exit(1)
    }

    const app = container.resolve(Application)

    app.run()
})()

async function databaseHealthCheck(): Promise<boolean> {
    try {
        await container.resolve(Database).createConnection()

        console.log('DataBase connection established')

        return true
    } catch (err) {
        console.log('DataBase connection failed', err)

        return false
    }
}
