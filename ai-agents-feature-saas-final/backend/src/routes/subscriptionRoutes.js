import { Router } from "express";
import { z } from "zod";
import { downgradeSubscription } from "../controllers/subscriptionController.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
const router = Router();
const downgradeSchema = z.object({
  body: z.object({
    planName: z.string().min(1, "planName is required"),
    maxAgents: z.number().int().min(0, "maxAgents must be a non-negative integer")
  })
});
router.use(authenticate);
router.post("/downgrade", validate(downgradeSchema), downgradeSubscription);
var stdin_default = router;
export {
  stdin_default as default
};
