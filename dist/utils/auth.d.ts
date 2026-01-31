export declare const generateToken: (user: any) => string;
export declare const generateRefreshToken: (id: string) => string;
export declare const verifyRefreshToken: (token: string) => {
    id: string;
};
export declare const hashPassword: (password: string) => Promise<string>;
export declare const comparePassword: (password: string, hashed: string) => Promise<boolean>;
//# sourceMappingURL=auth.d.ts.map