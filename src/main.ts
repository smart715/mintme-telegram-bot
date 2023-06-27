import "reflect-metadata";
import { Application, container } from "./app"

((): void => {
    const app = container.resolve(Application)

    app.run()
})()
