import { MongoClient } from "mongodb";
import { seedOrganizations } from "./organization.seed";
import { seedUsers } from "./user.seed";
import { seedProjects } from "./project.seed";
import { seedFeatureFlags } from "./feature-flag.seed";
import { createIndexes } from "./indexes.seed";
import * as dotenv from "dotenv";
import { join } from "path";

dotenv.config({ path: join(__dirname, "../../.env") });

async function seed() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("MONGODB_URI is not defined in environment variables");
    process.exit(1);
  }

  console.log("Connecting to MongoDB..."); // Debug log
  console.log(`URI: ${uri}`); // Debug log (be careful with this in production)

  let client;
  try {
    client = await MongoClient.connect(uri);
    const db = client.db();

    console.log("Connected to MongoDB successfully");

    // Run seeds in order
    await seedOrganizations(db);
    await seedUsers(db);
    await seedProjects(db);
    await seedFeatureFlags(db);
    await createIndexes(db);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

seed();
