import mongoose from "mongoose";
const connectDB = async (uri) => {
  const mongoURI = uri || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/dental_saas_db";
  try {
    const conn = await mongoose.connect(mongoURI);
    if (process.env.NODE_ENV !== "test") {
      console.log(`[MongoDB] Connected to database: ${conn.connection.name} @ ${conn.connection.host}`);
    }
    return conn;
  } catch (error) {
    console.error("[MongoDB] Connection error:", error);
    throw error;
  }
};
const disconnectDB = async () => {
  await mongoose.disconnect();
};
export {
  connectDB,
  disconnectDB
};
