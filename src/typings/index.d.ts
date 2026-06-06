declare global {
  namespace Express {
    interface UserPayload {
      _id: string;
      email: string;
      role?: string;
    }

    interface Request {
      user: UserPayload;
    }
  }
}

export {};