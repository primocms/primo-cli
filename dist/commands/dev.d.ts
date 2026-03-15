interface DevOptions {
    dir: string;
    port: string;
    server?: string;
    site?: string;
    token?: string;
}
export declare function dev_server(options: DevOptions): Promise<void>;
export {};
