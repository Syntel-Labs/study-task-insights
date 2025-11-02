import { Router } from "express";
import { getRecommendations, chatRaw } from "#controllers/llmController.js";

const router = Router();

router.get("/recommendations", getRecommendations);
router.post("/chat", chatRaw);

export default router;
