interface ExportOptions {
    server: string;
    site: string;
    output: string;
    token?: string;
}
export declare function export_site(options: ExportOptions): Promise<void>;
export {};
