import { Db, ObjectId } from "mongodb";
import { projectIds } from "./project.seed";

export async function seedFeatureFlags(db: Db) {
  try {
    await db.collection("feature_flags").deleteMany({});

    // First, get all projects with their organization IDs
    const projects = await db.collection("projects").find({}).toArray();

    // Create a map of project ID to organization ID
    const projectOrgMap = new Map(
      projects.map((project) => [project._id.toString(), project.organization])
    );

    console.log(
      "Creating flags for projects:",
      projectIds.map((id) => id.toString())
    );

    const flags = projectIds.flatMap(
      (projectId, pIndex) =>
        Array.from({ length: 5 }, (_, index) => {
          const orgId = projectOrgMap.get(projectId.toString());
          if (!orgId) {
            console.warn(
              `No organization found for project ${projectId.toString()}`
            );
            return null;
          }

          return {
            _id: new ObjectId(),
            name: `flag-${pIndex + 1}-${index + 1}`,
            description: `Feature flag ${index + 1} for project ${pIndex + 1}`,
            isEnabled: index % 2 === 0,
            project: projectId,
            organization: orgId, // Add the organization ID
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
          };
        }).filter((flag) => flag !== null) // Remove any null values
    );

    if (flags.length > 0) {
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
