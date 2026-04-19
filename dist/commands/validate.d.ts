interface ValidateOptions {
    dir: string;
    strict?: boolean;
}
export declare function normalize_site(site_dir: string): Promise<void>;
export declare function validate_site(options: ValidateOptions): Promise<void>;
export {};
