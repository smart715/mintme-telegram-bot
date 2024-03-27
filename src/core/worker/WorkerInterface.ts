export interface WorkerInterface {
    run(...args: any[]): Promise<void>;
    destroyDrivers(): Promise<void>;
    startAllClients(...args: any[]): Promise<void[]>;
}
