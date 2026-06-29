import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { appRouter } from "./server/routers";

async function testMutation() {
  // Create caller with mock logged-in user context
  const caller = appRouter.createCaller({
    req: {} as any,
    res: {} as any,
    user: {
      id: 1,
      openId: "mock-openid",
      name: "Mock User",
      email: "mock@example.com",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date()
    }
  });

  try {
    console.log("Calling card.create mutation...");
    const result = await caller.card.create({
      name: "Test User",
      designation: "Developer",
      phone: "123456789",
      email: "test@example.com",
      address: "123 Main St",
      officeName: "Test Company",
      officeDetails: "Details here",
      socialLinks: JSON.stringify({}),
      aspectRatio: "3:4"
    });
    console.log("Success! Result:", result);
  } catch (error) {
    console.error("Mutation failed with error:", error);
  }
}

testMutation();
