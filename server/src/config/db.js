import mongoose from "mongoose";

// Connect the main Express process to MongoDB.
export async function connectDB() {
  const mongoUri =
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai_scraper_agent";

  await mongoose.connect(mongoUri);
  console.log("✅ MongoDB connected");
}
