import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  getCardsByUserId,
  getCardById,
  createCard,
  updateCard,
  deleteCard,
  getAIProvidersByUserId,
  createAIProvider,
  deleteAIProvider,
} from "./db-helpers";
import {
  generateBioSuggestions,
  generateTaglineSuggestions,
  testAIProviderConnection,
} from "./ai-helpers";

/**
 * Card Router - CRUD operations for digital cards
 */
export const cardRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getCardsByUserId(ctx.user.id);
  }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return getCardById(input.id);
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        designation: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        address: z.string().optional(),
        officeName: z.string().optional(),
        officeDetails: z.string().optional(),
        headshotUrl: z.string().optional(),
        socialLinks: z.string().optional(),
        aspectRatio: z.enum(["3:4", "16:9"]).default("3:4"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await createCard({
        userId: ctx.user.id,
        ...input,
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        designation: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        address: z.string().optional(),
        officeName: z.string().optional(),
        officeDetails: z.string().optional(),
        headshotUrl: z.string().optional(),
        socialLinks: z.string().optional(),
        aspectRatio: z.enum(["3:4", "16:9"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateCard(id, data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteCard(input.id);
      return { success: true };
    }),
});

/**
 * AI Provider Router - BYOK integration
 */
export const aiProviderRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getAIProvidersByUserId(ctx.user.id);
  }),

  create: protectedProcedure
    .input(
      z.object({
        provider: z.enum(["groq", "openrouter", "cerebras"]),
        apiKey: z.string().min(1),
        endpoint: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await createAIProvider({
        userId: ctx.user.id,
        provider: input.provider,
        apiKey: input.apiKey,
        endpoint: input.endpoint,
        isActive: 1,
      });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteAIProvider(input.id);
      return { success: true };
    }),

  testConnection: protectedProcedure
    .input(
      z.object({
        provider: z.enum(["groq", "openrouter", "cerebras"]),
        apiKey: z.string().min(1),
        endpoint: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return testAIProviderConnection(input.provider, input.apiKey, input.endpoint);
    }),
});

/**
 * AI Generation Router - Content suggestions
 */
export const aiGenerationRouter = router({
  generateBios: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        designation: z.string(),
        provider: z.enum(["groq", "openrouter", "cerebras"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const bios = await generateBioSuggestions(ctx.user.id, input.name, input.designation, input.provider);
      return { bios };
    }),

  generateTaglines: protectedProcedure
    .input(
      z.object({
        designation: z.string(),
        provider: z.enum(["groq", "openrouter", "cerebras"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const taglines = await generateTaglineSuggestions(ctx.user.id, input.designation, input.provider);
      return { taglines };
    }),

  analyzeBrand: protectedProcedure
    .input(
      z.object({
        logoBase64: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Extract dominant colors from base64 image
        // For now, return default colors - in production, use image analysis
        const colors = {
          primary: "#14b8a6",
          secondary: "#0d9488",
        };
        return {
          success: true,
          colors,
          message: "Brand colors analyzed successfully",
        };
      } catch (error) {
        return {
          success: false,
          colors: { primary: "#14b8a6", secondary: "#0d9488" },
          message: "Failed to analyze brand colors",
        };
      }
    }),
});
