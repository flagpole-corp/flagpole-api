import { Db, ObjectId } from "mongodb";
import * as bcrypt from "bcrypt";
import { orgId, orgIds } from "./organization.seed";
import { faker } from "@faker-js/faker";
import { projectIds } from "./project.seed"; // Import project IDs

export const userId1 = new ObjectId();
export const userId2 = new ObjectId();

export const testUserId = new ObjectId();
export const userIds = Array.from({ length: 19 }, () => new ObjectId()); // 19 more users

export async function seedUsers(db: Db) {
  try {
    await db.collection("users").deleteMany({});

    const testUserPassword = await bcrypt.hash("1234", 10);
    const defaultPassword = await bcrypt.hash("password123", 10);

    const users = [
      // Main test user
      {
        _id: testUserId,
        email: "user@test.com",
        password: testUserPassword,
        firstName: "Test",
        lastName: "User",
        status: "active",
        provider: "local",
        organizations: [
          {
            organization: orgId,
            role: "owner",
            joinedAt: new Date(),
          },
        ],
        projects: projectIds.map((projectId) => ({
          project: projectId,
          addedAt: new Date(),
        })),
        currentOrganization: orgId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      ...userIds.map((id, index) => {
        // Determine which projects this user has access to
        const userProjects = projectIds
          .slice(0, 3) // First 3 projects for each user
          .filter(() => Math.random() > 0.3) // Randomly skip some projects
          .map((projectId) => ({
            project: projectId,
            addedAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
          }));

        return {
          _id: id,
          email: `${faker.person.firstName().toLowerCase()}@test.com`,
          password: defaultPassword,
          firstName: `User`,
          lastName: `${index + 1}`,
          status: faker.helpers.arrayElement(["pending", "active", "inactive"]),
          provider: index % 3 === 0 ? "google" : "local",
          organizations: [
            {
              organization: index < 10 ? orgId : orgIds[index % orgIds.length],
              role: faker.helpers.arrayElement(["member", "owner", "admin"]),
              joinedAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
            },
          ],
          currentOrganization:
            index < 10 ? orgId : orgIds[index % orgIds.length],
          projects: userProjects,
          createdAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        };
      }),
    ];

    await db.collection("users").insertMany(users);
    console.log(
      `Created users: ${users.length} ->`,
      users.map((user) => ({
        id: user._id.toString(),
        email: user.email,
        organization: user.currentOrganization.toString(),
      }))
    );
  } catch (error) {
    console.error("Error seeding users:", error);
    throw error;
  }
}
