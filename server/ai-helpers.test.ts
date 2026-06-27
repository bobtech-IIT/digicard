import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateBioSuggestions, generateTaglineSuggestions, testAIProviderConnection } from "./ai-helpers";

describe("AI Helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateBioSuggestions", () => {
    it("should return default suggestions when AI fails", async () => {
      const suggestions = await generateBioSuggestions(1, "John Doe", "Product Designer");
      expect(suggestions).toHaveLength(3);
      expect(suggestions[0]).toBeTruthy();
      expect(suggestions[0].length).toBeGreaterThan(0);
    });

    it("should return array of strings", async () => {
      const suggestions = await generateBioSuggestions(1, "Jane Smith", "Software Engineer");
      expect(Array.isArray(suggestions)).toBe(true);
      suggestions.forEach((suggestion) => {
        expect(typeof suggestion).toBe("string");
      });
    });
  });

  describe("generateTaglineSuggestions", () => {
    it("should return default taglines when AI fails", async () => {
      const taglines = await generateTaglineSuggestions(1, "Product Designer");
      expect(taglines).toHaveLength(3);
      expect(taglines[0]).toBeTruthy();
    });

    it("should return array of strings", async () => {
      const taglines = await generateTaglineSuggestions(1, "Software Engineer");
      expect(Array.isArray(taglines)).toBe(true);
      taglines.forEach((tagline) => {
        expect(typeof tagline).toBe("string");
      });
    });
  });

  describe("testAIProviderConnection", () => {
    it("should return success false for invalid provider", async () => {
      const result = await testAIProviderConnection("invalid", "test-key");
      expect(result.success).toBe(false);
      expect(result.message).toBeTruthy();
    });

    it("should return object with success and message fields", async () => {
      const result = await testAIProviderConnection("groq", "test-key");
      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("message");
      expect(typeof result.success).toBe("boolean");
      expect(typeof result.message).toBe("string");
    });
  });
});
