import { MongoClient } from "mongodb";
import { orgId, seedOrganizations } from "./organization.seed";
import { seedUsers, testUserId } from "./user.seed";
import { projectId1, projectId2, seedProjects } from "./project.seed";
import { seedFeatureFlags } from "./feature-flag.seed";
import { createIndexes } from "./indexes.seed";
import * as dotenv from "dotenv";
import { join } from "path";

dotenv.config({ path: join(__dirname, "../../.env") });

// src/scripts/seed.ts
async function seed() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("MONGODB_URI is not defined in environment variables");
    process.exit(1);
  }

  let client;
  try {
    client = await MongoClient.connect(uri);
    const db = client.db();

    console.log("Connected to MongoDB successfully");

    // Create indexes first to ensure unique constraints
    await createIndexes(db);

    // Clear all collections first
    await Promise.all([
      db.collection("organizations").deleteMany({}),
      db.collection("users").deleteMany({}),
      db.collection("projects").deleteMany({}),
      db.collection("feature_flags").deleteMany({}),
    ]);

    // Run seeds in order
    await seedOrganizations(db);
    await seedUsers(db);
    await seedProjects(db);
    await seedFeatureFlags(db);

    // Log some useful information
    console.log("\nTest Data Summary:");
    console.log("------------------");
    console.log("Test User:");
    console.log("  Email: user@test.com");
    console.log("  Password: 1234");
    console.log("\nIDs for verification:");
    console.log("  Organization:", orgId.toString());
    console.log("  Test User:", testUserId.toString());
    console.log("  Project 1:", projectId1.toString());
    console.log("  Project 2:", projectId2.toString());
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
