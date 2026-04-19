interface DevOptions {
    dir: string;
    port: string;
    force?: boolean;
}
export declare function dev_server(options: DevOptions): Promise<void>;
export {};
