import { Db, ObjectId } from "mongodb";
import { orgId, orgIds } from "./organization.seed";
import { testUserId, userIds } from "./user.seed";

export const projectIds = Array.from({ length: 10 }, () => new ObjectId());

export async function seedProjects(db: Db) {
  try {
    await db.collection("projects").deleteMany({});

    const projects = projectIds.map((id, index) => ({
      _id: id,
      name: `Project ${index + 1}`,
      description: `Description for Project ${index + 1}`,
      organization: index < 5 ? orgId : orgIds[index % orgIds.length],
      status: "active",
      members: [
        {
          user: testUserId,
          role: "owner",
          addedAt: new Date(),
        },
        ...userIds.slice(0, 3).map((userId) => ({
          user: userId,
          role: "member",
          addedAt: new Date(),
        })),
      ],
      createdAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    }));

    await db.collection("projects").insertMany(projects);
    console.log(
      "Created projects:",
      projects.map((project) => ({
        id: project._id.toString(),
        name: project.name,
        organization: project.organization.toString(),
      }))
    );
  } catch (error) {
    console.error("Error seeding projects:", error);
    throw error;
  }
}
