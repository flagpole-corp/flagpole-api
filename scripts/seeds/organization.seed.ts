import { MongoClient, ObjectId } from "mongodb";

export const orgId = new ObjectId();

export async function seedOrganizations(db: any) {
  try {
    await db.collection("organizations").deleteMany({});

    await db.collection("organizations").insertOne({
      _id: orgId,
      name: "Acme Corporation",
      slug: "acme-corp",
      subscriptionStatus: "active",
      members: [
        {
          user: Math.round(Math.random() * 10000),
          role: "owner",
          joinedAt: new Date(),
          permissions: ["manage_members", "manage_projects", "manage_flags"],
        },
        {
          user: Math.round(Math.random() * 10000),
          role: "member",
          joinedAt: new Date(),
          permissions: ["view_projects", "view_flags"],
        },
      ],
      settings: {
        defaultEnvironments: ["development", "staging", "production"],
        allowedDomains: ["acme.com"],
        notificationEmails: ["admin@acme.com"],
      },
      subscription: {
        status: "active",
        plan: "pro",
        startDate: new Date(),
        trialEndsAt: null,
        maxProjects: 10,
        maxMembers: 20,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("Organizations seeded successfully!");
  } catch (error) {
    console.error("Error seeding organizations:", error);
    throw error;
  }
}
