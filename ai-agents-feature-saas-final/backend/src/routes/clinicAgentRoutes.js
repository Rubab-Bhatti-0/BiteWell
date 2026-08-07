import { Router } from "express";
import { z } from "zod";
import { getClinicAgents, enableAgent, disableAgent } from "../controllers/clinicAgentController.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
const router = Router();
const agentParamSchema = z.object({
  params: z.object({
    agentId: z.string().min(1, "agentId parameter is required")
  })
});
router.use(authenticate);
router.get("/", getClinicAgents);
router.post("/:agentId/enable", validate(agentParamSchema), enableAgent);
router.post("/:agentId/disable", validate(agentParamSchema), disableAgent);
var stdin_default = router;
export {
  stdin_default as default
};
