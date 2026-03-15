interface PublishOptions {
    dir: string;
    provider?: string;
}
export declare function publish(options: PublishOptions): Promise<void>;
export {};
