import { Router } from "express";
import {
  CClaimQueue,
  CReleaseQueue,
  CGetCurrentQueues,
  CNextQueue,
  CSkipQueue,
  CResetQueues,
  CGetMetrics,
  CSearchQueues,
  CGetAllQueues,
  CGetQueueById,
  CCreateQueue,
  CUpdateQueue,
  CUpdateQueueStatus,
  CDeleteQueue,
  CBulkDeleteQueues,
  CServeQueue,
} from "../controllers/queue.controller";
import { MValidate } from "../middlewares/validate.middleware";
import { MAuthenticate } from "../middlewares/authenticate.middleware";
import {
  VGetSearchSchema,
  VNextQueueSchema,
  VResetQueueSchema,
  VSkipQueueSchema,
  VGetQueuesQuerySchema,
  VCreateQueueSchema,
  VUpdateQueueSchema,
  VQueueStatusSchema,
  VBaseID,
} from "../validations/validation";

const router = Router();

router.get("/metrics", CGetMetrics);
router.post("/claim", CClaimQueue);
router.post("/release", CReleaseQueue);
router.get("/current", CGetCurrentQueues);
router.get("/search", MValidate(VGetSearchSchema, "query"), CSearchQueues);

router.post("/next/:counter_id", MAuthenticate, MValidate(VBaseID, "params"), CNextQueue);
router.post("/skip", MAuthenticate, MValidate(VSkipQueueSchema), CSkipQueue);
router.post(
  "/reset",
  MAuthenticate,
  MValidate(VResetQueueSchema),
  CResetQueues
);
router.get(
  "/",
  MValidate(VGetQueuesQuerySchema, "query"),
  CGetAllQueues
);
router.get(
  "/:id",
  MValidate(VBaseID, "params"),
  CGetQueueById
);
router.post(
  "/create",
  MAuthenticate,
  MValidate(VCreateQueueSchema),
  CCreateQueue
);
router.put(
  "/:id",
  MAuthenticate,
  MValidate(VBaseID, "params"),
  MValidate(VUpdateQueueSchema),
  CUpdateQueue
);
router.patch(
  "/:id/status",
  MAuthenticate,
  MValidate(VBaseID, "params"),
  MValidate(VQueueStatusSchema),
  CUpdateQueueStatus
);
router.delete(
  "/:id",
  MAuthenticate,
  MValidate(VBaseID, "params"),
  CDeleteQueue
);
router.post(
  "/bulk-delete",
  MAuthenticate,
  CBulkDeleteQueues
);
router.post(
  "/serve",
  MAuthenticate,
  MValidate(VSkipQueueSchema), 
  CServeQueue
);

export default router;
