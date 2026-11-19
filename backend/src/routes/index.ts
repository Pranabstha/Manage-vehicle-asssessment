import { Router } from "express";
import vehicleRouter from "./vehicle.routes.js";

const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

apiRouter.use("/vehicles", vehicleRouter);

export default apiRouter;
