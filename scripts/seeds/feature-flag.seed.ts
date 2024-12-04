import { Db, ObjectId } from "mongodb";
import { projectIds } from "./project.seed";

export async function seedFeatureFlags(db: Db) {
  try {
    await db.collection("feature_flags").deleteMany({});

    // Log all project IDs we're creating flags for
    console.log(
      "Creating flags for projects:",
      projectIds.map((id) => id.toString())
    );

    const flags = projectIds.flatMap((projectId, pIndex) =>
      Array.from({ length: 5 }, (_, index) => ({
        _id: new ObjectId(),
        name: `flag-${pIndex + 1}-${index + 1}`,
        description: `Feature flag ${index + 1} for project ${pIndex + 1}`,
        isEnabled: index % 2 === 0,
        project: projectId, // Make sure this matches the project's _id
        conditions:
          index === 0
            ? {
                userGroups: ["beta-testers"],
                percentage: 50,
              }
            : {},
        environments:
          index < 2
            ? ["development", "staging", "production"]
            : index < 4
            ? ["development", "staging"]
            : ["development"],
        createdAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      }))
    );

    await db.collection("feature_flags").insertMany(flags);

    // Add verification log
    console.log("Feature flags created:");
    const createdFlags = await db
      .collection("feature_flags")
      .find({})
      .toArray();
    console.log("Sample of created flags:", createdFlags.slice(0, 2));
    console.log(`Total flags created: ${createdFlags.length}`);

    // Add verification query
    const flagsForFirstProject = await db
      .collection("feature_flags")
      .find({ project: projectIds[0] })
      .toArray();
    console.log(
      `Flags for first project (${projectIds[0].toString()}):`,
      flagsForFirstProject.length
    );
  } catch (error) {
    console.error("Error seeding feature flags:", error);
    throw error;
  }
}
