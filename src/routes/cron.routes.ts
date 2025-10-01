import { Router } from "express";
import {
  CGetCronJobsStatus,
  CRunJobManually,
  CControlJob,
  CGetCleanupPreview,
  CRunCleanupManually,
  CValidateCronExpression,
} from "../controllers/cron.controller";
import { MAuthenticate } from "../middlewares/authenticate.middleware";
import { MValidate } from "../middlewares/validate.middleware";
import { VBaseID } from "../validations/validation";

const router = Router();

router.use(MAuthenticate);

router.get("/status", CGetCronJobsStatus);

router.post("/run/:jobName", MValidate(VBaseID, "params"), CRunJobManually);

router.patch("/control/:jobName", MValidate(VBaseID, "params"), CControlJob);

router.get("/cleanup/preview", CGetCleanupPreview);

router.post("/cleanup/run", CRunCleanupManually);

router.post("/validate", CValidateCronExpression);

export default router;
