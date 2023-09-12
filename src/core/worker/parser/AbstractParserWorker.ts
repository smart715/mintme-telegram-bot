import { AbstractTokenWorker } from '../AbstractTokenWorker'

export abstract class AbstractParserWorker extends AbstractTokenWorker {
    protected abstract run(): Promise<void>
}
