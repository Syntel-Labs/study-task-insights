import { Router } from "express";
import {
  getList,
  getOne,
  createMany,
  updateManyCtrl,
  deleteManyCtrl,
} from "#controllers/studySessionsController.js";

const router = Router();

router.get("/", getList);
router.get("/:id", getOne);
router.post("/", createMany);
router.put("/", updateManyCtrl);
router.delete("/", deleteManyCtrl);

export default router;
