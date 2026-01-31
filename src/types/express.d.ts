declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: string;
        phone?: string;
        companyName?: string;
        licenseNo?: string;
        address?: string;
        experience?: number;
        rating?: number;
        totalReviews?: number;
        location?: string;
        bio?: string;
        profileImage?: string;
        createdAt: Date;
        updatedAt: Date;
      };
    }
  }
}

export {};
