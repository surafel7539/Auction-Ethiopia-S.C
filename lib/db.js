import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  (process.env.NODE_ENV === "production"
    ? ""
    : "mongodb://127.0.0.1:27017/auction-ethiopia");

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not set");
}

const globalForMongo = globalThis;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!globalForMongo.mongoConnect) {
    globalForMongo.mongoConnect = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 45000,
        family: 4,
      })
      .catch((error) => {
        globalForMongo.mongoConnect = null;
        throw error;
      });
  }

  return globalForMongo.mongoConnect;
}
