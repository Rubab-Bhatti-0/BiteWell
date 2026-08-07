import { Router } from "express";
import { getAnalytics } from "../controllers/analyticsController.js";
import { authenticate } from "../middleware/auth.js";
const router = Router();
router.use(authenticate);
router.get("/agents", getAnalytics);
var stdin_default = router;
export {
  stdin_default as default
};
