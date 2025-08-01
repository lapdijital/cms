import Credentials from "@auth/core/providers/credentials";
import { AuthConfig } from "@auth/core/types";
import { ExpressAuth } from "@auth/express";

export const authConfig: AuthConfig = {
    providers: [
        Credentials({
            credentials: {
                username: { label: "Username" },
                password: { label: "Password", type: "password" },
            },
            async authorize({ username, password }) {
                // Replace with your actual user authentication logic
                if (username === "admin" && password === "admin") {
                    return { id: "1", name: "Admin", email: "admin@example.com" };
                }
                return null;
            },
        }),
    ],
    secret: process.env.AUTH_SECRET || "your-secret-key-here",
    trustHost: true,
    callbacks: {
        async session({ session, token }) {
            if (token) {
                session.user.id = token.sub!;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id;
            }
            return token;
        }
    },
    pages: {
        signIn: "/login",
        error: "/auth/error"
    }
};

export const authHandler = ExpressAuth(authConfig);
