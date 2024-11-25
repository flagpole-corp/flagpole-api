import { MongoClient, ObjectId } from "mongodb";
import { orgId } from "./organization.seed";
import { userId1, userId2 } from "./user.seed";

export const projectId1 = new ObjectId();
export const projectId2 = new ObjectId();

export async function seedProjects(db: any) {
  try {
    await db.collection("projects").deleteMany({});

    await db.collection("projects").insertMany([
      {
        _id: projectId1,
        name: "Mobile App",
        description: "Mobile application feature flags",
        organization: orgId,
        status: "active",
        members: [
          {
            user: userId1,
            role: "owner",
            addedAt: new Date(),
          },
          {
            user: userId2,
            role: "member",
            addedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: projectId2,
        name: "Web Platform",
        description: "Web platform feature flags",
        organization: orgId,
        status: "active",
        members: [
          {
            user: userId1,
            role: "owner",
            addedAt: new Date(),
          },
          {
            user: userId2,
            role: "member",
            addedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    console.log("Projects seeded successfully!");
  } catch (error) {
    console.error("Error seeding projects:", error);
    throw error;
  }
}
