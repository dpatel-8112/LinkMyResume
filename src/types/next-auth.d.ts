import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import { JWT } from "next-auth/jwt"

// By declaring this module, we are extending the existing NextAuth types.
declare module "next-auth" {
    /**
     * The shape of the user object in the session, returned by `useSession`, `getSession`, etc.
     */
    interface Session {
        user: {
            /** The user's unique identifier. */
            id: string;
        } & DefaultSession["user"]; // Keep the default properties like name, email, image
    }

    /**
     * The shape of the user object returned by the database adapter.
     */
    interface User extends DefaultUser {
        id: string;
    }
}

declare module "next-auth/jwt" {
    /** The shape of the JWT token. */
    interface JWT {
        /** The user's unique identifier. */
        id: string;
    }
}
