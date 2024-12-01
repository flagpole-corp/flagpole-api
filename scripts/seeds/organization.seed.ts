import { MongoClient, ObjectId } from "mongodb";
import { userId1, userId2, testUserId } from "./user.seed"; // Import user IDs

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
          user: userId1, // Use actual user ID
          role: "owner",
          joinedAt: new Date(),
          permissions: ["manage_members", "manage_projects", "manage_flags"],
        },
        {
          user: userId2, // Use actual user ID
          role: "member",
          joinedAt: new Date(),
          permissions: ["view_projects", "view_flags"],
        },
        {
          user: testUserId, // Add test user
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
    // Log IDs for verification
    console.log("Organization ID:", orgId.toString());
    console.log("User IDs:", {
      admin: userId1.toString(),
      dev: userId2.toString(),
      test: testUserId.toString(),
    });
  } catch (error) {
    console.error("Error seeding organizations:", error);
    throw error;
  }
}
