import app from "./app.js";
import { connectDB } from "./config/database.js";
const PORT = process.env.PORT || 5e3;
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`\u{1F680} Dental SaaS Backend Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};
if (process.env.NODE_ENV !== "test") {
  startServer();
}
