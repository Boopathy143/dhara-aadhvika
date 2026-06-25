import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URL;
const dbName = process.env.DB_NAME || 'ecommerce';

let client;
let clientPromise;

if (!global._mongoClientPromise) {
  client = new MongoClient(uri);
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

export async function getDb() {
  const c = await clientPromise;
  return c.db(dbName);
}

export async function col(name) {
  const db = await getDb();
  return db.collection(name);
}
