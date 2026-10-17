import { Router, type IRouter } from "express";
import healthRouter from "./health";
import paketRouter from "./paket";

const router: IRouter = Router();

router.use(healthRouter);
router.use(paketRouter);

export default router;
