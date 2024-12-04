import { MongoClient, ObjectId } from "mongodb";
import { Db } from "mongodb";
import { faker } from "@faker-js/faker";

export const orgId = new ObjectId();
export const orgIds = Array.from({ length: 9 }, () => new ObjectId());

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
          startDate: faker.date.past(),
          maxProjects: 10,
          maxMembers: 20,
        },
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
      },

      ...orgIds.map((id, index) => {
        const companyName = faker.company.name();
        const slug = companyName.toLowerCase().replace(/[^a-z0-9]/g, "-");
        const domain = `${slug}.com`;

        return {
          _id: id,
          name: companyName,
          slug,
          subscriptionStatus: faker.helpers.arrayElement([
            "active",
            "trial",
            "inactive",
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
            status: faker.helpers.arrayElement(["active", "trial", "inactive"]),
            plan: faker.helpers.arrayElement([
              "free",
              "basic",
              "pro",
              "enterprise",
            ]),
            startDate: faker.date.past(),
            maxProjects: faker.helpers.arrayElement([5, 10, 20, 50]),
            maxMembers: faker.helpers.arrayElement([10, 20, 50, 100]),
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
