import { projectId1, projectId2 } from "./project.seed";

export async function seedFeatureFlags(db: any) {
  try {
    await db.collection("feature_flags").deleteMany({});

    await db.collection("feature_flags").insertMany([
      {
        name: "new-user-onboarding",
        description: "Enable new user onboarding flow",
        isEnabled: false,
        project: projectId1,
        conditions: {},
        environments: ["development", "staging", "production"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "dark-mode",
        description: "Enable dark mode in mobile app",
        isEnabled: true,
        project: projectId1,
        conditions: {},
        environments: ["development", "staging"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "new-dashboard",
        description: "Enable new dashboard design",
        isEnabled: false,
        project: projectId2,
        conditions: {},
        environments: ["development"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "beta-features",
        description: "Enable beta features for selected users",
        isEnabled: true,
        project: projectId2,
        conditions: {
          userGroups: ["beta-testers"],
        },
        environments: ["production"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    console.log("Feature flags seeded successfully!");
  } catch (error) {
    console.error("Error seeding feature flags:", error);
    throw error;
  }
}
