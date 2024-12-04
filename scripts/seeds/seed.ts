import { MongoClient, Db } from "mongodb";
import * as dotenv from "dotenv";
import { join } from "path";
import { seedOrganizations, orgId, orgIds } from "./organization.seed";
import { seedUsers, testUserId, userIds } from "./user.seed";
import { seedProjects, projectIds } from "./project.seed";
import { seedFeatureFlags } from "./feature-flag.seed";
import { createIndexes } from "./indexes.seed";

dotenv.config({ path: join(__dirname, "../../.env") });

async function seed() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("MONGODB_URI is not defined in environment variables");
    process.exit(1);
  }

  let client: MongoClient | null = null;
  let db: Db;

  try {
    console.log("\n🌱 Starting database seed...");

    client = await MongoClient.connect(uri);
    db = client.db();

    console.log("\n🧹 Cleaning existing data...");
    // Clear all collections
    await Promise.all([
      db.collection("organizations").deleteMany({}),
      db.collection("users").deleteMany({}),
      db.collection("projects").deleteMany({}),
      db.collection("feature_flags").deleteMany({}),
    ]);

    console.log("\n📦 Seeding data...");
    // Run seeds in order
    await seedOrganizations(db);
    await seedUsers(db);
    await seedProjects(db);
    await seedFeatureFlags(db);
    await createIndexes(db);

    console.log("\n📝 Test Data Summary");
    console.log("===================");

    console.log("\n🔑 Main Test Account:");
    console.log("  Email: user@test.com");
    console.log("  Password: 1234");

    console.log("\n🏢 Organizations:");
    console.log("  Main Organization ID:", orgId.toString());
    console.log("  Additional Orgs:", orgIds.length);

    console.log("\n👥 Users:");
    console.log("  Main Test User ID:", testUserId.toString());
    console.log("  Additional Users:", userIds.length);

    console.log("\n📋 Projects:");
    console.log("  Total Projects:", projectIds.length);
    console.log("  Main Organization Projects:", projectIds.slice(0, 5).length);
    console.log("  Project IDs:");
    projectIds.forEach((id, index) => {
      console.log(`    ${index + 1}. ${id.toString()}`);
    });

    console.log("\n🚀 Feature Flags:");
    console.log("  Flags per project: 5");
    console.log("  Total flags:", projectIds.length * 5);

    console.log("\n✅ Database seeded successfully!");

    console.log("\n📌 Quick Reference:");
    console.log("  - Each project has 5 feature flags");
    console.log("  - First 5 projects belong to the main organization");
    console.log(
      "  - Test user has access to all projects in main organization"
    );
    console.log(
      "  - Different users have different roles (owner, admin, member)"
    );
    console.log(
      "  - Organizations have different subscription statuses (active, trial, inactive)"
    );
  } catch (error) {
    console.error("\n❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log("\n🔌 Database connection closed");
    }
  }
}

// Run the seed
console.log("🌱 Database Seeder");
console.log("=================");
seed().catch(console.error);
