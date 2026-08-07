import { Router } from "express";
import { z } from "zod";
import { getAgents, logUsage } from "../controllers/agentController.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
const router = Router();
const usageSchema = z.object({
  body: z.object({
    action: z.string().min(1, "Action string is required"),
    tokensUsed: z.number().optional().default(0),
    metadata: z.record(z.any()).optional().default({})
  }),
  params: z.object({
    agentId: z.string().min(1)
  })
});
const agentIdParamSchema = z.object({
  params: z.object({
    agentId: z.string().min(1)
  })
});
router.use(authenticate);
router.get("/", getAgents);
router.post("/:agentId/usage", validate(usageSchema), logUsage);
var stdin_default = router;
export {
  stdin_default as default
};
