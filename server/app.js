import express from "express";
import helmet from "helmet";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifyPassword, publicUser } from "./security.js";
import { command, view, AppError } from "./domain.js";
import { dateKey } from "./seed.js";
export function createApp(store) {
  const app = express(),
    sessions = new Map(),
    attempts = new Map();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "script-src": ["'self'"],
          "style-src": ["'self'", "'unsafe-inline'"],
          "img-src": ["'self'", "data:"],
          "upgrade-insecure-requests": null,
        },
      },
    }),
  );
  app.use(express.json({ limit: "100kb" }));
  app.use("/api", (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  app.use("/api", (req, res, next) => {
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.headers.origin
    ) {
      const allowed = process.env.APP_ORIGIN;
      const hostOrigin = req.headers.host
        ? `${req.protocol}://${req.headers.host}`
        : null;
      const local = [
        "http://localhost:4000",
        "http://127.0.0.1:4000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
      ];
      const allowedOrigins = allowed
        ? allowed.split(",").map((s) => s.trim())
        : [];
      if (
        req.headers.origin !== hostOrigin &&
        !allowedOrigins.includes(req.headers.origin) &&
        !local.includes(req.headers.origin)
      )
        return res.status(403).json({ error: "Origin not allowed." });
    }
    next();
  });
  app.get("/api/health", (_req, res) =>
    res.json({ ok: true, storage: store.mode, date: dateKey() }),
  );
  app.post("/api/login", async (req, res) => {
    const key = req.ip,
      now = Date.now();
    let attempt = attempts.get(key);
    if (!attempt || attempt.until < now)
      attempt = { count: 0, until: now + 15 * 60 * 1000 };
    if (attempt.count >= 20)
      return res
        .status(429)
        .json({ error: "Too many login attempts. Try again in 15 minutes." });
    const { email, password } = req.body || {};
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      password.length > 128
    )
      return res.status(400).json({ error: "Enter your email and password." });
    const data = await store.read(),
      user = data.users.find((u) => u.email === email.trim().toLowerCase());
    if (!user || !verifyPassword(password, user.passwordHash)) {
      attempt.count++;
      attempts.set(key, attempt);
      return res.status(401).json({ error: "Incorrect email or password." });
    }
    attempts.delete(key);
    for (const [k, v] of sessions) if (v.expires < now) sessions.delete(k);
    const old = (req.headers.cookie || "")
      .split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith("nexus_session="))
      ?.slice(14);
    if (old) sessions.delete(old);
    const token = randomBytes(32).toString("hex"),
      csrf = randomBytes(24).toString("hex");
    sessions.set(token, {
      userId: user.id,
      csrf,
      expires: now + 8 * 60 * 60 * 1000,
    });
    res.cookie("nexus_session", token, {
      httpOnly: true,
      sameSite: "strict",
      secure:
        process.env.COOKIE_SECURE === "true" ||
        req.secure ||
        req.headers["x-forwarded-proto"] === "https",
      maxAge: 8 * 60 * 60 * 1000,
      path: "/",
    });
    res.json({ user: publicUser(user), csrf });
  });
  app.use("/api", async (req, res, next) => {
    const token = (req.headers.cookie || "")
      .split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith("nexus_session="))
      ?.slice(14);
    const session = sessions.get(token);
    if (!session || session.expires < Date.now()) {
      if (session) sessions.delete(token);
      return res.status(401).json({ error: "Please sign in to continue." });
    }
    if (req.method !== "GET" && req.headers["x-csrf-token"] !== session.csrf)
      return res
        .status(403)
        .json({ error: "Invalid session token. Reload and try again." });
    const data = await store.read();
    const user = data.users.find((u) => u.id === session.userId);
    if (!user) return res.status(401).json({ error: "Account not found." });
    req.user = user;
    req.session = session;
    req.token = token;
    next();
  });
  app.get("/api/me", (req, res) =>
    res.json({ user: publicUser(req.user), csrf: req.session.csrf }),
  );
  app.post("/api/logout", (req, res) => {
    sessions.delete(req.token);
    res.clearCookie("nexus_session", { path: "/" });
    res.json({ ok: true });
  });
  app.get("/api/state", async (req, res) =>
    res.json({
      data: view(await store.read(), req.user),
      storage: store.mode,
      today: dateKey(),
    }),
  );
  app.post("/api/commands/:action", async (req, res) => {
    const result = await store.mutate((s) =>
      command(s, req.user, req.params.action, req.body || {}),
    );
    res.json({ ok: true, result });
  });
  app.use("/api", (_req, res) =>
    res.status(404).json({ error: "API route not found." }),
  );
  const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../dist",
  );
  app.use(express.static(root));
  app.get("/{*path}", (_req, res) =>
    res.sendFile(path.join(root, "index.html")),
  );
  app.use((err, _req, res, _next) => {
    if (err instanceof AppError)
      return res.status(err.status).json({ error: err.message });
    if (err.type === "entity.parse.failed")
      return res.status(400).json({ error: "Invalid JSON request." });
    if (err.type === "entity.too.large")
      return res.status(413).json({ error: "Request is too large." });
    console.error(err.message);
    res
      .status(500)
      .json({ error: "The operation could not be saved. Please try again." });
  });
  return app;
}
