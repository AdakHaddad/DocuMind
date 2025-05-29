import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI!);

export async function connectToDatabase() {
  try {
    // Attempt to connect, if already connected, this is a no-op
    await client.connect();

    // Return the database instance
    return client.db();
  } catch (error) {
    console.error("Failed to connect to the database", error);
    throw new Error("Failed to connect to the database");
  }
}
