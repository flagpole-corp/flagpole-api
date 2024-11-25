export async function createIndexes(db: any) {
  try {
    await db
      .collection("organizations")
      .createIndex({ slug: 1 }, { unique: true });
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db
      .collection("projects")
      .createIndex({ name: 1, organization: 1 }, { unique: true });
    await db
      .collection("feature_flags")
      .createIndex({ name: 1, project: 1 }, { unique: true });

    console.log("Indexes created successfully!");
  } catch (error) {
    console.error("Error creating indexes:", error);
    throw error;
  }
}
