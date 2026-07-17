import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    role: v.string(),
    organization: v.string(),
    professionalBackground: v.string(),
    topics: v.array(v.string()),
    createdAt: v.number(),
  }),

  styleProfiles: defineTable({
    userId: v.id("users"),
    profileText: v.string(),
    userWritingSample: v.optional(v.string()),
    selectedStyles: v.array(v.string()),
    sampleWritingWeight: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  posts: defineTable({
    userId: v.id("users"),
    topic: v.string(),
    userInput: v.optional(v.string()),
    mode: v.string(),
    generatedContent: v.string(),
    regenerateNote: v.optional(v.string()),
    finalContent: v.optional(v.string()),
    status: v.string(),
    editsDiff: v.optional(v.string()),
    createdAt: v.number(),
    finalizedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"]),

  backgroundInputs: defineTable({
    userId: v.id("users"),
    linkedinPaste: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
});
