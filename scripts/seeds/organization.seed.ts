import { ObjectId } from "mongodb";
import { Db } from "mongodb";
import { faker } from "@faker-js/faker";
import {
  PLAN_LIMITS,
  SubscriptionPlan,
  SubscriptionStatus,
} from "../../src/common/enums/subscription.enum";

export const orgId = new ObjectId("6750ab92edcaf782ea116863");
export const orgIds = Array.from({ length: 9 }, () => new ObjectId());

export async function seedOrganizations(db: Db) {
  try {
    await db.collection("organizations").deleteMany({});

    // In organization.seed.ts
    const organizations = [
      {
        _id: orgId,
        name: "Acme Corporation",
        slug: "acme-corp",
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        settings: {
          defaultEnvironments: ["development", "staging", "production"],
          allowedDomains: ["acme.com"],
          notificationEmails: ["admin@acme.com"],
        },
        subscription: {
          status: SubscriptionStatus.ACTIVE,
          plan: SubscriptionPlan.PRO, // Updated to match enum
          startDate: faker.date.past(),
          maxProjects: PLAN_LIMITS[SubscriptionPlan.PRO].maxProjects,
          maxMembers: PLAN_LIMITS[SubscriptionPlan.PRO].maxUsers,
        },
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
      },

      // Update the faker generated ones too
      ...orgIds.map((id, index) => {
        const companyName = faker.company.name();
        const slug = companyName.toLowerCase().replace(/[^a-z0-9]/g, "-");
        const domain = `${slug}.com`;
        const plan: SubscriptionPlan = faker.helpers.arrayElement([
          SubscriptionPlan.IC,
          SubscriptionPlan.PRO,
          SubscriptionPlan.ENTERPRISE,
          SubscriptionPlan.TRIAL,
        ]);

        const planLimits = PLAN_LIMITS[plan];

        return {
          _id: id,
          name: companyName,
          slug,
          subscriptionStatus: faker.helpers.arrayElement([
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.TRIAL,
            SubscriptionStatus.INACTIVE,
          ]),
          settings: {
            defaultEnvironments: faker.helpers.arrayElements(
              ["development", "staging", "production", "qa", "sandbox"],
              { min: 2, max: 5 }
            ),
            allowedDomains: [domain],
            notificationEmails: [
              `admin@${domain}`,
              `dev@${domain}`,
              `support@${domain}`,
            ].slice(0, faker.number.int({ min: 1, max: 3 })),
          },
          subscription: {
            status: faker.helpers.arrayElement([
              SubscriptionStatus.ACTIVE,
              SubscriptionStatus.TRIAL,
              SubscriptionStatus.INACTIVE,
            ]),
            plan: plan,
            startDate: faker.date.past(),
            maxProjects: planLimits.maxProjects,
            maxUsers: planLimits.maxUsers,
          },
          createdAt: faker.date.past(),
          updatedAt: faker.date.recent(),
        };
      }),
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
