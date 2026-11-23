import { Router, type IRouter } from "express";
import healthRouter from "./health";
import paketRouter from "./paket";
import adminUsersRouter from "./admin-users";
import adminAuditTrailRouter from "./admin-audit-trail";
import adminRoleManagementRouter from "./admin-role-management";

const router: IRouter = Router();

router.use(healthRouter);
router.use(adminUsersRouter);
router.use(adminAuditTrailRouter);
router.use(adminRoleManagementRouter);
router.use(paketRouter);

export default router;
