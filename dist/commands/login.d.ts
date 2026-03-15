interface LoginOptions {
    server: string;
    email?: string;
    password?: string;
}
export declare function login(options: LoginOptions): Promise<void>;
export {};
