import mongoose from "mongoose";

function getMongoUri() {
  const uri =
    process.env.MONGODB_URI ||
    (process.env.NODE_ENV === "production"
      ? ""
      : "mongodb://127.0.0.1:27017/auction-ethiopia");
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }
  return uri;
}

const globalForMongo = globalThis;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const mongoUri = getMongoUri();

  if (!globalForMongo.mongoConnect) {
    globalForMongo.mongoConnect = mongoose
      .connect(mongoUri, {
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
