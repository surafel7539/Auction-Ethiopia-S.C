import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/auction-ethiopia";

const globalForMongo = globalThis;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!globalForMongo.mongoConnect) {
    globalForMongo.mongoConnect = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  return globalForMongo.mongoConnect;
}
