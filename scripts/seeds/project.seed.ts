import { Db, ObjectId } from "mongodb";
import { orgId, orgIds } from "./organization.seed";
import { testUserId, userIds } from "./user.seed";
import { faker } from "@faker-js/faker";

export const projectIds = [
  new ObjectId("6758ab93edcaf782ea116883"),
  ...Array.from({ length: 10 }, () => new ObjectId()),
];

export async function seedProjects(db: Db) {
  try {
    await db.collection("projects").deleteMany({});

    const projects = projectIds.map((id, index) => ({
      _id: id,
      name: faker.company.catchPhrase(),
      description: faker.lorem.paragraph(),
      organization: index < 5 ? orgId : orgIds[index % orgIds.length],
      status: faker.helpers.arrayElement(["active", "archived", "draft"]),
      members: [
        {
          user: testUserId,
          role: "owner",
          addedAt: faker.date.past(),
        },
        ...userIds.slice(0, 3).map((userId) => ({
          user: userId,
          role: faker.helpers.arrayElement(["admin", "member", "viewer"]),
          addedAt: faker.date.past(),
        })),
      ],
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
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
