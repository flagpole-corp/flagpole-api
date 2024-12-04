import { MongoClient, ObjectId } from "mongodb";
import { Db } from "mongodb";

export const orgId = new ObjectId(); // Main test org
export const orgIds = Array.from({ length: 9 }, () => new ObjectId()); // 9 more orgs

export async function seedOrganizations(db: Db) {
  try {
    await db.collection("organizations").deleteMany({});

    const organizations = [
      {
        _id: orgId,
        name: "Acme Corporation",
        slug: "acme-corp",
        subscriptionStatus: "active",
        settings: {
          defaultEnvironments: ["development", "staging", "production"],
          allowedDomains: ["acme.com"],
          notificationEmails: ["admin@acme.com"],
        },
        subscription: {
          status: "active",
          plan: "pro",
          startDate: new Date(),
          maxProjects: 10,
          maxMembers: 20,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      ...orgIds.map((id, index) => ({
        _id: id,
        name: `Test Organization ${index + 1}`,
        slug: `test-org-${index + 1}`,
        subscriptionStatus:
          index < 3 ? "active" : index < 6 ? "trial" : "inactive",
        settings: {
          defaultEnvironments: ["development", "production"],
          allowedDomains: [`org${index + 1}.com`],
          notificationEmails: [`admin@org${index + 1}.com`],
        },
        subscription: {
          status: index < 3 ? "active" : index < 6 ? "trial" : "inactive",
          plan: index < 3 ? "pro" : index < 6 ? "basic" : "free",
          startDate: new Date(Date.now() - index * 30 * 24 * 60 * 60 * 1000), // Different start dates
          maxProjects: index < 3 ? 10 : 5,
          maxMembers: index < 3 ? 20 : 10,
        },
        createdAt: new Date(Date.now() - index * 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      })),
    ];

    await db.collection("organizations").insertMany(organizations);
    console.log(
      "Created organizations:",
      organizations.map((org) => ({
        id: org._id.toString(),
        name: org.name,
        status: org.subscriptionStatus,
      }))
    );
  } catch (error) {
    console.error("Error seeding organizations:", error);
    throw error;
  }
}
