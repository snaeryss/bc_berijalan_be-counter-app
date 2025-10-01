import { Router } from "express";
import {
  CLogin,
  CCreateAdmin,
  CUpdateAdmin,
  CDeleteAdmin,
  CGetAllAdmins,
  CGetAdminById,
  CToggleAdminStatus,
} from "../controllers/auth.controller";
import { MValidate } from "../middlewares/validate.middleware";
import { MAuthenticate } from "../middlewares/authenticate.middleware";
import {
  MCache,
  MInvalidateCache,
  CachePresets,
} from "../middlewares/cache.middleware";
import {
  VAdminSchema,
  VBaseID,
  VLoginSchema,
  VUpdateAdminSchema,
} from "../validations/validation";

const router = Router();

router.post("/login", MValidate(VLoginSchema), CLogin);

router.get("/", MAuthenticate, MCache(CachePresets.medium(300)), CGetAllAdmins);

router.get(
  "/:id",
  MAuthenticate,
  MValidate(VBaseID, "params"),
  MCache(CachePresets.user(600)),
  CGetAdminById
);

router.post(
  "/create",
  MAuthenticate,
  MValidate(VAdminSchema),
  MInvalidateCache(["medium_cache:*", "user_cache:*"]),
  CCreateAdmin
);

router.put(
  "/:id",
  MAuthenticate,
  MValidate(VBaseID, "params"),
  MValidate(VUpdateAdminSchema),
  MInvalidateCache(["medium_cache:*", "user_cache:*"]),
  CUpdateAdmin
);

router.delete(
  "/:id",
  MAuthenticate,
  MValidate(VBaseID, "params"),
  MInvalidateCache(["medium_cache:*", "user_cache:*"]),
  CDeleteAdmin
);

router.patch(
  "/:id/toggle-status",
  MAuthenticate,
  MValidate(VBaseID, "params"),
  MInvalidateCache(["medium_cache:*", "user_cache:*"]),
  CToggleAdminStatus
);

export default router;
