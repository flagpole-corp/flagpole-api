import { Db, ObjectId } from "mongodb";
import * as bcrypt from "bcrypt";
import { orgId, orgIds } from "./organization.seed";

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
        provider: "local",
        organizations: [
          {
            organization: orgId,
            role: "owner",
            joinedAt: new Date(),
          },
        ],
        currentOrganization: orgId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Additional users with various roles and organizations
      ...userIds.map((id, index) => ({
        _id: id,
        email: `user${index + 1}@test.com`,
        password: defaultPassword,
        firstName: `User`,
        lastName: `${index + 1}`,
        provider: index % 3 === 0 ? "google" : "local",
        organizations: [
          {
            organization: index < 10 ? orgId : orgIds[index % orgIds.length],
            role:
              index % 3 === 0 ? "admin" : index % 3 === 1 ? "member" : "viewer",
            joinedAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
          },
        ],
        currentOrganization: index < 10 ? orgId : orgIds[index % orgIds.length],
        createdAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      })),
    ];

    await db.collection("users").insertMany(users);
    console.log(
      "Created users:",
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
