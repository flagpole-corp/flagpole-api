import { ObjectId } from "mongodb";
import * as bcrypt from "bcrypt";
import { orgId } from "./organization.seed";

export const userId1 = new ObjectId();
export const userId2 = new ObjectId();
export const testUserId = new ObjectId(); // Test user ID

export async function seedUsers(db: any) {
  try {
    await db.collection("users").deleteMany({});

    const hashedPassword = await bcrypt.hash("password123", 10);
    const testUserPassword = await bcrypt.hash("1234", 10); // Test user password

    await db.collection("users").insertMany([
      {
        _id: userId1,
        email: "admin@acme.com",
        password: hashedPassword,
        firstName: "John",
        lastName: "Doe",
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
      {
        _id: userId2,
        email: "dev@acme.com",
        password: hashedPassword,
        firstName: "Jane",
        lastName: "Smith",
        provider: "local",
        organizations: [
          {
            organization: orgId,
            role: "member",
            joinedAt: new Date(),
          },
        ],
        currentOrganization: orgId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Test user with known credentials
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
            role: "member",
            joinedAt: new Date(),
          },
        ],
        currentOrganization: orgId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    console.log("Users seeded successfully!");
    console.log("Test user created with:");
    console.log("Email: user@test.com");
    console.log("Password: 1234");
  } catch (error) {
    console.error("Error seeding users:", error);
    throw error;
  }
}
