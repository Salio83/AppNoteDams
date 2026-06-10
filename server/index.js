import express from "express";
import cors from "cors";
import "dotenv/config";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../src/shared/services/auth.js";
import { PrismaClient } from "@prisma/client";
import path from "path";
import { fileURLToPath } from "url";
import { createProxyMiddleware } from "http-proxy-middleware";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load UE configuration
const configPath = path.join(__dirname, "../config/ue.json");
const ALL_UES = JSON.parse(fs.readFileSync(configPath, "utf8"));

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy is essential when running behind Nginx
app.set('trust proxy', 1);

app.use(cors({
    origin: true, // Allow the origin that matches the request
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Logging middleware
app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url} ${res.statusCode}`);
    });
    next();
});

// Proxy for University Schedule
app.use(createProxyMiddleware({
    target: 'https://proseconsult.umontpellier.fr',
    changeOrigin: true,
    pathFilter: '/jsp',
    secure: false, // matches nginx proxy_ssl_verify off
}));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// Better Auth Handler
app.use("/api/auth", toNodeHandler(auth));

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

// --- Health Check (utilisé par Docker pour vérifier que le backend est prêt) ---

app.get("/api/health", async (req, res) => {
    try {
        // Vérifie que la DB répond
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: "ok", timestamp: new Date().toISOString() });
    } catch (e) {
        res.status(503).json({ status: "error", error: e.message });
    }
});

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

// --- Rankings ---

app.get("/api/grades/rankings", requireAuth, async (req, res) => {
    try {
        const semester = parseInt(req.query.semester) || 1;

        const currentUser = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        if (!currentUser.filiere || !currentUser.annee) {
            return res.json({ error: "missing_profile", message: "Profil incomplet (filière ou année manquante)" });
        }

        // 1. Get all users in same filiere and annee
        const peerUsers = await prisma.user.findMany({
            where: {
                filiere: currentUser.filiere,
                annee: currentUser.annee
            },
            include: {
                grades: true
            }
        });

        if (peerUsers.length <= 0) {
            return res.json({ error: "no_users", message: "Aucun utilisateur trouvé pour cette filière" });
        }

        // 2. Filter config by semester
        const semesterUEs = ALL_UES.filter(ue => ue.semester === semester);
        const ueCategories = [...new Set(semesterUEs.map(ue => ue.category))];

        // 3. Helper to calculate stats for a user
        const calculateUserStats = (userGrades) => {
            const stats = {
                subjects: {}, // ueId -> average
                ues: {},      // category -> average
                overall: null
            };

            // a. Subject Averages
            const gradesByUE = {};
            userGrades.forEach(g => {
                if (!gradesByUE[g.ueId]) gradesByUE[g.ueId] = [];
                gradesByUE[g.ueId].push(g);
            });

            semesterUEs.forEach(configUE => {
                const grades = gradesByUE[String(configUE.id)] || [];
                if (grades.length > 0) {
                    let sum = 0;
                    let totalCoef = 0;
                    grades.forEach(g => {
                        sum += g.value * g.coef;
                        totalCoef += g.coef;
                    });
                    stats.subjects[configUE.id] = totalCoef > 0 ? sum / totalCoef : null;
                } else {
                    stats.subjects[configUE.id] = null;
                }
            });

            // b. UE Category Averages
            let totalWeightedSum = 0;
            let totalWeightTotal = 0;

            ueCategories.forEach(cat => {
                const catUEs = semesterUEs.filter(ue => ue.category === cat);
                let catSum = 0;
                let catWeight = 0;

                catUEs.forEach(ue => {
                    const avg = stats.subjects[ue.id];
                    if (avg !== null) {
                        catSum += avg * ue.coef_ue;
                        catWeight += ue.coef_ue;
                    }
                });

                if (catWeight > 0) {
                    const catAvg = catSum / catWeight;
                    stats.ues[cat] = catAvg;
                    totalWeightedSum += catAvg;
                    totalWeightTotal += 1;
                } else {
                    stats.ues[cat] = null;
                }
            });

            // c. Overall
            if (totalWeightTotal > 0) {
                stats.overall = totalWeightedSum / totalWeightTotal;
            }

            return stats;
        };

        // 4. Calculate for everyone
        const allStats = peerUsers.map(u => ({
            userId: u.id,
            stats: calculateUserStats(u.grades)
        }));

        // 5. Function to get rank
        const getRank = (userId, metricPath, type) => {
            const values = allStats.map(s => {
                if (type === 'subject') return s.stats.subjects[metricPath];
                if (type === 'ue') return s.stats.ues[metricPath];
                return s.stats.overall;
            }).filter(v => v !== null && v !== undefined);

            if (values.length === 0) return null;

            const userStat = allStats.find(s => s.userId === userId).stats;
            let targetValue;
            if (type === 'subject') targetValue = userStat.subjects[metricPath];
            else if (type === 'ue') targetValue = userStat.ues[metricPath];
            else targetValue = userStat.overall;

            if (targetValue === null || targetValue === undefined) return null;

            // Standard Competition Ranking (1224)
            const betterCount = values.filter(v => v > targetValue).length;

            return {
                rank: betterCount + 1,
                total: values.length,
                average: values.reduce((a, b) => a + b, 0) / values.length
            };
        };

        // 6. Build response for current user
        const rankings = {
            overall: getRank(currentUser.id, null, 'overall'),
            ues: {},
            subjects: {}
        };

        ueCategories.forEach(cat => {
            rankings.ues[cat] = getRank(currentUser.id, cat, 'ue');
        });

        semesterUEs.forEach(ue => {
            rankings.subjects[ue.id] = getRank(currentUser.id, ue.id, 'subject');
        });

        res.json(rankings);

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to calculate rankings" });
    }
});

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

// --- Schedule Events ---

app.get("/api/schedule/events", requireAuth, async (req, res) => {
    try {
        const events = await prisma.scheduleEvent.findMany({
            where: { userId: req.user.id },
            orderBy: { start: "asc" }
        });
        res.json(events);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch schedule events" });
    }
});

app.post("/api/schedule/events", requireAuth, async (req, res) => {
    try {
        const { events } = req.body;

        // Supprimer tous les anciens événements de l'utilisateur
        await prisma.scheduleEvent.deleteMany({
            where: { userId: req.user.id }
        });

        // Créer les nouveaux événements
        const createdEvents = await prisma.scheduleEvent.createMany({
            data: events.map(event => ({
                userId: req.user.id,
                title: event.title,
                start: new Date(event.start),
                end: new Date(event.end),
                location: event.location || null,
                description: event.description || null,
            }))
        });

        res.json({ success: true, count: createdEvents.count });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to save schedule events" });
    }
});

// --- User Settings (Schedule & Profile) ---

app.get("/api/user/settings", requireAuth, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                scheduleUrl: true,
                filiere: true,
                annee: true,
                groupe: true
            }
        });
        res.json({
            scheduleUrl: user?.scheduleUrl,
            filiere: user?.filiere,
            annee: user?.annee,
            groupe: user?.groupe
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch user settings" });
    }
});

app.post("/api/user/settings", requireAuth, async (req, res) => {
    try {
        const { scheduleUrl, filiere, annee, groupe } = req.body;
        await prisma.user.update({
            where: { id: req.user.id },
            data: {
                scheduleUrl,
                filiere,
                annee,
                groupe
            }
        });
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to update user settings" });
    }
});

// --- Schedule Matching (Onboarding) ---

app.get("/api/user/match-schedule", requireAuth, async (req, res) => {
    try {
        const { filiere, annee, groupe } = req.query;

        if (!filiere || !annee || !groupe) {
            return res.json({ matched: false, reason: "Missing profile fields" });
        }

        // Find another user with same profile who has schedule events
        const matchingUser = await prisma.user.findFirst({
            where: {
                filiere,
                annee,
                groupe,
                id: { not: req.user.id },
                scheduleEvents: { some: {} }
            },
            select: { id: true }
        });

        if (!matchingUser) {
            return res.json({ matched: false });
        }

        // Copy schedule events from matching user
        const events = await prisma.scheduleEvent.findMany({
            where: { userId: matchingUser.id }
        });

        // Delete any existing events for current user first
        await prisma.scheduleEvent.deleteMany({
            where: { userId: req.user.id }
        });

        await prisma.scheduleEvent.createMany({
            data: events.map(e => ({
                userId: req.user.id,
                title: e.title,
                start: e.start,
                end: e.end,
                location: e.location,
                description: e.description
            }))
        });

        // Also copy the scheduleUrl if the current user doesn't have one
        const currentUser = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { scheduleUrl: true }
        });

        if (!currentUser.scheduleUrl) {
            const matchedUserFull = await prisma.user.findUnique({
                where: { id: matchingUser.id },
                select: { scheduleUrl: true }
            });
            if (matchedUserFull?.scheduleUrl) {
                await prisma.user.update({
                    where: { id: req.user.id },
                    data: { scheduleUrl: matchedUserFull.scheduleUrl }
                });
            }
        }

        res.json({ matched: true, eventsCount: events.length });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to match schedule" });
    }
});

// Backward compatibility (optional but good)
app.get("/api/user/schedule", requireAuth, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { scheduleUrl: true }
        });
        res.json({ scheduleUrl: user?.scheduleUrl });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch schedule URL" });
    }
});

app.post("/api/user/schedule", requireAuth, async (req, res) => {
    try {
        const { scheduleUrl } = req.body;
        await prisma.user.update({
            where: { id: req.user.id },
            data: { scheduleUrl }
        });
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to update schedule URL" });
    }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('/*path', (req, res) => {
    console.log(`Catch-all hit for: ${req.url}`);
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
