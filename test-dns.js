import { MongoClient } from "mongodb";
import "dotenv/config";

const client = new MongoClient(process.env.MONGODB_URI);

try {
  console.log("Connecting...");
  await client.connect();
  console.log("Connected!");
} catch (err) {
  console.error(err);
} finally {
  await client.close().catch(() => {});
}