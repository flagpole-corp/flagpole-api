import { Db, ObjectId } from "mongodb";
import { projectIds } from "./project.seed";

export async function seedFeatureFlags(db: Db) {
  try {
    await db.collection("feature_flags").deleteMany({});

    const flags = projectIds.flatMap((projectId, pIndex) =>
      Array.from({ length: 5 }, (_, index) => ({
        _id: new ObjectId(),
        name: `flag-${pIndex + 1}-${index + 1}`,
        description: `Feature flag ${index + 1} for project ${pIndex + 1}`,
        isEnabled: index % 2 === 0,
        project: projectId,
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
    console.log(`Created ${flags.length} feature flags`);
  } catch (error) {
    console.error("Error seeding feature flags:", error);
    throw error;
  }
}
