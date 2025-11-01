import { Router } from "express";
import {
  getList,
  getOne,
  refresh,
} from "#controllers/weeklyProductivityController.js";

const router = Router();

router.get("/", getList);
router.get("/:year/:week", getOne);
router.post("/refresh", refresh);

export default router;
