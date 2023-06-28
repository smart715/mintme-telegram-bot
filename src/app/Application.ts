import { singleton } from "tsyringe";
import { CMCWorker } from "../core";

@singleton()
export class Application {

    public constructor(private cmcWorker: CMCWorker) {

    }

    public run(): void {
        this.cmcWorker.run();
    }
}
