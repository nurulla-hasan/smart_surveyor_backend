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
    static changePassword(userId: string, currentPasswordText: string, newPasswordText: string): Promise<boolean>;
}
//# sourceMappingURL=auth.service.d.ts.map