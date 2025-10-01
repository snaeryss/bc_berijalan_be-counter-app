import { Router } from "express";
import authRoutes from "./auth.routes";
import counterRoutes from "./counter.routes";
import queueRoutes from "./queue.routes";
import cronRoutes from "./cron.routes";
import { CInitSSE } from "../controllers/sse.controller";

const router = Router();

const API_PREFIX = "/api/v1";

router.use(`${API_PREFIX}/auth`, authRoutes);

router.use(`${API_PREFIX}/counters`, counterRoutes);

router.use(`${API_PREFIX}/queues`, queueRoutes);

router.use(`${API_PREFIX}/cron`, cronRoutes);

router.get(`${API_PREFIX}/sse`, CInitSSE);

export default router;
