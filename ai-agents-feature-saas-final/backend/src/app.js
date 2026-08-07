import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";
import clinicAgentRoutes from "./routes/clinicAgentRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import { errorHandler, AppError } from "./middleware/errorHandler.js";
import { serveClient } from "../serve_client.js";
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "Dental SaaS AI Agent Backend" });
});
app.get("/", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "Dental SaaS AI Agent Backend API",
    message: "Backend server is running successfully.",
    frontendDashboardUrl: "http://localhost:5000/dashboard/ai-agents"
  });
});
app.use("/api/auth", authRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/clinic/agents", clinicAgentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/subscription", subscriptionRoutes);
// Serve the built React SPA (static assets + client-side route fallback)
serveClient(app);

app.use((_req, _res, next) => {
  next(new AppError("API endpoint not found", 404));
});
app.use(errorHandler);
var stdin_default = app;
export {
  stdin_default as default
};
