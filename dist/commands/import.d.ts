interface ImportOptions {
    server?: string;
    site?: string;
    dir: string;
    token?: string;
    preview?: boolean;
}
export declare function import_site(options: ImportOptions): Promise<void>;
export {};
