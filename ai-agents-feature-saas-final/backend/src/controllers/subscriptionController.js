import { Subscription } from "../models/Subscription.js";
import { agentService } from "../services/agentService.js";
import { asyncHandler, AppError } from "../middleware/errorHandler.js";
const downgradeSubscription = asyncHandler(async (req, res) => {
  const clinicId = req.clinicId;
  const { planName, maxAgents } = req.body;
  if (typeof maxAgents !== "number" || maxAgents < 0) {
    throw new AppError("Valid maxAgents number is required.", 400);
  }
  const subscription = await Subscription.findOneAndUpdate(
    { clinicId },
    {
      planName: planName || "Downgraded",
      maxAgents,
      status: "active"
    },
    { new: true, upsert: true }
  );
  const disabledAgents = await agentService.disableExtraAgentsAfterDowngrade(clinicId, maxAgents);
  res.status(200).json({
    success: true,
    message: "Subscription downgraded successfully.",
    subscription: {
      planName: subscription.planName,
      maxAgents: subscription.maxAgents,
      status: subscription.status
    },
    disabledAgents
  });
});
export {
  downgradeSubscription
};
