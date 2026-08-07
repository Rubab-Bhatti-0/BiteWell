import { agentService } from "../services/agentService.js";
import { asyncHandler } from "../middleware/errorHandler.js";
const getAnalytics = asyncHandler(async (req, res) => {
  const clinicId = req.clinicId;
  const analytics = await agentService.getAnalytics(clinicId);
  res.status(200).json(analytics);
});
export {
  getAnalytics
};
