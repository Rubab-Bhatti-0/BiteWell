import { ZodError } from "zod";
import { AppError } from "./errorHandler.js";
const validate = (schema) => {
  return (req, _res, next) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
        return next(new AppError(`Validation Error: ${issues}`, 400));
      }
      next(error);
    }
  };
};
export {
  validate
};
