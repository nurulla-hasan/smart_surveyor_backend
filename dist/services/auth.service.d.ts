export declare class AuthService {
    static register(data: any): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    static login(email: string, passwordText: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    static refreshToken(token: string): Promise<{
        accessToken: string;
    }>;
}
//# sourceMappingURL=auth.service.d.ts.map