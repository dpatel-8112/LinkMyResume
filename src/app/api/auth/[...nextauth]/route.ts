// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { AuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const authOptions: AuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'text', placeholder: 'jsmith@example.com' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials.password) {
                    throw new Error('Please enter an email and password');
                }

                // Find the user in your database
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user || !user.passwordHash) {
                    throw new Error('No user found with this email');
                }

                // Check if the password matches
                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.passwordHash
                );

                if (!isPasswordValid) {
                    throw new Error('Incorrect password');
                }

                return user;
            },
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        // These callbacks add the user's ID to the session token
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login', // Optional: customize your sign-in page URL
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };