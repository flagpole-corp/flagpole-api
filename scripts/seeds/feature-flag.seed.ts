import { Db, ObjectId } from "mongodb";
import { projectIds } from "./project.seed";
import { faker } from "@faker-js/faker";

export async function seedFeatureFlags(db: Db) {
  try {
    await db.collection("feature_flags").deleteMany({});

    // First, get all projects with their organization IDs
    const projects = await db.collection("projects").find({}).toArray();

    const projectOrgMap = new Map(
      projects.map((project) => [project._id.toString(), project.organization])
    );

    console.log(
      "Creating flags for projects:",
      projectIds.map((id) => id.toString())
    );

    const featureTypes = [
      "authentication",
      "payment",
      "ui",
      "api",
      "notification",
      "analytics",
    ];

    const flags = projectIds.flatMap((projectId, pIndex) =>
      Array.from({ length: 5 }, (_, index) => {
        const orgId = projectOrgMap.get(projectId.toString());
        if (!orgId) {
          console.warn(
            `No organization found for project ${projectId.toString()}`
          );
          return null;
        }

        const featureType = faker.helpers.arrayElement(featureTypes);
        const feature = faker.word
          .words({ count: { min: 1, max: 3 } })
          .toLowerCase()
          .replace(/\s+/g, "-");
        const flagName = `${featureType}-${feature}`;

        return {
          _id: new ObjectId(),
          name: flagName,
          description: faker.lorem.sentence(),
          isEnabled: faker.datatype.boolean(),
          project: projectId,
          organization: orgId,
          conditions:
            index === 0
              ? {
                  userGroups: faker.helpers.arrayElements(
                    ["beta-testers", "premium-users", "internal", "developers"],
                    { min: 1, max: 3 }
                  ),
                  percentage: faker.number.int({ min: 10, max: 100 }),
                }
              : {},
          environments: faker.helpers.arrayElements(
            ["development", "staging", "production"],
            { min: 1, max: 3 }
          ),
          createdAt: faker.date.past(),
          updatedAt: faker.date.recent(),
        };
      }).filter((flag) => flag !== null)
    );

    if (flags.length > 0) {
      await db.collection("feature_flags").insertMany(flags);

      console.log("Feature flags created:");
      const createdFlags = await db
        .collection("feature_flags")
        .find({})
        .toArray();
      console.log("Sample of created flags:", createdFlags.slice(0, 2));
      console.log(`Total flags created: ${createdFlags.length}`);
    } else {
      console.error(
        "No flags were created - check project/organization mapping"
      );
    }
  } catch (error) {
    console.error("Error seeding feature flags:", error);
    throw error;
  }
}
