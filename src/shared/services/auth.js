// lib/auth.js
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "sqlite",
    }),
    emailAndPassword: {
        enabled: true,
    },
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    advanced: {
        cookiePrefix: "appnote",
        useSecureCookies: false // Essential for HTTP (IP address)
    },
    trustedOrigins: [
        "http://localhost:5173",
        "http://localhost:4173",
        "http://localhost:3000",
        "https://krono-etu.com",
        process.env.BETTER_AUTH_URL,
        ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",") || [])
    ].filter(Boolean)
});