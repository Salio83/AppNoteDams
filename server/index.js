import express from "express";
import cors from "cors";
import "dotenv/config";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../src/lib/auth.js";
import { PrismaClient } from "@prisma/client";
import path from "path";
import { fileURLToPath } from "url";
import { createProxyMiddleware } from "http-proxy-middleware";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [/^http:\/\/localhost(:\d+)?$/, /^http:\/\/127\.0\.0\.1(:\d+)?$/];
        
        // Allow production URL
        if (process.env.BETTER_AUTH_URL && origin === process.env.BETTER_AUTH_URL) {
            return callback(null, true);
        }

        const isAllowed = allowedOrigins.some(regex => regex.test(origin));
        
        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"]
}));

app.use(express.json());

// Proxy for University Schedule
app.use('/jsp', createProxyMiddleware({
    target: 'https://proseconsult.umontpellier.fr',
    changeOrigin: true,
    secure: false, // matches nginx proxy_ssl_verify off
}));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// Better Auth Handler
app.all("/api/auth/*splat", toNodeHandler(auth));

// Middleware to check authentication using Better Auth
const requireAuth = async (req, res, next) => {
    try {
        const session = await auth.api.getSession({
            headers: req.headers
        });

        if (!session) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        
        req.user = session.user;
        next();
    } catch (e) {
        console.error("Auth check failed", e);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// API Routes

// --- Grades ---

app.get("/api/grades", requireAuth, async (req, res) => {
    try {
        const grades = await prisma.grade.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: "desc" }
        });
        res.json(grades);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch grades" });
    }
});

app.post("/api/grades", requireAuth, async (req, res) => {
    try {
        const { ue_id, value, coef } = req.body;
        // Note: ue_id comes as int from frontend often, but we stored as String or Int in DB?
        // Schema says String. Let's cast to String just in case.
        const grade = await prisma.grade.create({
            data: {
                userId: req.user.id,
                ueId: String(ue_id),
                value: parseFloat(value),
                coef: parseFloat(coef),
            }
        });
        res.json(grade);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to create grade" });
    }
});

app.delete("/api/grades/:id", requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.grade.delete({
            where: { id, userId: req.user.id } // Ensure ownership
        });
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to delete grade" });
    }
});

// --- Tasks ---

app.get("/api/tasks", requireAuth, async (req, res) => {
    try {
        const tasks = await prisma.task.findMany({
            where: { userId: req.user.id },
            orderBy: { date: "asc" }
        });
        res.json(tasks);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch tasks" });
    }
});

app.post("/api/tasks", requireAuth, async (req, res) => {
    try {
        const { title, date, description } = req.body;
        const task = await prisma.task.create({
            data: {
                userId: req.user.id,
                title,
                date: new Date(date),
                description,
            }
        });
        res.json(task);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to create task" });
    }
});

app.delete("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.task.delete({
            where: { id, userId: req.user.id }
        });
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to delete task" });
    }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*splat', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
