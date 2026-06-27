import { invokeLLM } from "./_core/llm";
import { getActiveAIProvider } from "./db-helpers";

interface AIGenerationRequest {
  userId: number;
  prompt: string;
  provider?: "groq" | "openrouter" | "cerebras";
}

interface AIGenerationResponse {
  content: string;
  provider: string;
  success: boolean;
}

/**
 * Generate content using BYOK provider or fallback to built-in LLM
 */
export async function generateAIContent(request: AIGenerationRequest): Promise<AIGenerationResponse> {
  const { userId, prompt, provider } = request;

  // Try BYOK provider if specified
  if (provider) {
    try {
      const aiProvider = await getActiveAIProvider(userId, provider);
      if (aiProvider && aiProvider.apiKey) {
        const content = await callExternalAIProvider(provider, aiProvider.apiKey, aiProvider.endpoint, prompt);
        return {
          content,
          provider,
          success: true,
        };
      }
    } catch (error) {
      console.warn(`[AI] BYOK provider ${provider} failed, falling back to built-in LLM:`, error);
    }
  }

  // Fallback to built-in LLM
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a professional business card content writer. Generate concise, impactful content for digital visiting cards.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const messageContent = response.choices?.[0]?.message?.content;
    const content = typeof messageContent === "string" ? messageContent : "";
    return {
      content,
      provider: "builtin",
      success: true,
    };
  } catch (error) {
    console.error("[AI] Built-in LLM failed:", error);
    return {
      content: "",
      provider: "builtin",
      success: false,
    };
  }
}

/**
 * Call external AI provider (Groq, OpenRouter, Cerebras)
 */
async function callExternalAIProvider(
  provider: string,
  apiKey: string,
  endpoint: string | null | undefined,
  prompt: string
): Promise<string> {
  const baseEndpoints: Record<string, string> = {
    groq: "https://api.groq.com/openai/v1/chat/completions",
    openrouter: "https://openrouter.ai/api/v1/chat/completions",
    cerebras: "https://api.cerebras.ai/v1/chat/completions",
  };

  const url = endpoint || baseEndpoints[provider];
  if (!url) throw new Error(`Unknown provider: ${provider}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: getModelForProvider(provider),
      messages: [
        {
          role: "system",
          content: "You are a professional business card content writer. Generate concise, impactful content for digital visiting cards.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 200,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI provider error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

/**
 * Get the appropriate model for each provider
 */
function getModelForProvider(provider: string): string {
  const models: Record<string, string> = {
    groq: "mixtral-8x7b-32768",
    openrouter: "meta-llama/llama-2-70b-chat",
    cerebras: "llama-3-70b",
  };
  return models[provider] || "gpt-3.5-turbo";
}

/**
 * Generate bio suggestions
 */
export async function generateBioSuggestions(
  userId: number,
  name: string,
  designation: string,
  provider?: "groq" | "openrouter" | "cerebras"
): Promise<string[]> {
  const prompt = `Generate 3 professional and catchy bio lines for a ${designation} named ${name}. 
Each line should be 10-15 words, inspiring, and suitable for a digital visiting card. 
Return only the 3 lines, one per line, without numbering or extra formatting.`;

  const response = await generateAIContent({ userId, prompt, provider });

  if (!response.success) {
    return [
      "Innovative professional driving digital transformation",
      "Passionate about creating exceptional experiences",
      "Dedicated to excellence and continuous growth",
    ];
  }

  return response.content
    .split("\n")
    .filter((line) => line.trim())
    .slice(0, 3);
}

/**
 * Generate tagline suggestions
 */
export async function generateTaglineSuggestions(
  userId: number,
  designation: string,
  provider?: "groq" | "openrouter" | "cerebras"
): Promise<string[]> {
  const prompt = `Generate 3 catchy and professional taglines for a ${designation}. 
Each tagline should be 5-8 words, memorable, and suitable for a digital visiting card. 
Return only the 3 taglines, one per line, without numbering or extra formatting.`;

  const response = await generateAIContent({ userId, prompt, provider });

  if (!response.success) {
    return [
      "Excellence in every interaction",
      "Transforming ideas into reality",
      "Your trusted professional partner",
    ];
  }

  return response.content
    .split("\n")
    .filter((line) => line.trim())
    .slice(0, 3);
}

/**
 * Test AI provider connection
 */
export async function testAIProviderConnection(
  provider: string,
  apiKey: string,
  endpoint?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const testPrompt = "Say 'Connection successful' in one word.";
    const content = await callExternalAIProvider(provider, apiKey, endpoint, testPrompt);

    if (content.toLowerCase().includes("success") || content.length > 0) {
      return {
        success: true,
        message: "Connection successful",
      };
    }
    return {
      success: false,
      message: "Invalid response from provider",
    };
  } catch (error) {
    return {
      success: false,
      message: `Connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Clean and format card details using AI
 */
export async function cleanCardDataWithAI(
  userId: number,
  cardFields: {
    name: string;
    designation: string;
    phone: string;
    email: string;
    address: string;
    officeName: string;
    officeDetails: string;
  },
  provider?: "groq" | "openrouter" | "cerebras"
): Promise<any> {
  const prompt = `Format and clean up the following details for a professional visiting card:
Name: ${cardFields.name}
Designation: ${cardFields.designation}
Phone: ${cardFields.phone}
Email: ${cardFields.email}
Address: ${cardFields.address}
Office Name: ${cardFields.officeName}
Office Details: ${cardFields.officeDetails}

Follow these strict cleanup rules:
1. Standardize the Phone number to a clean, readable mobile format (e.g. "+91 XXXXX XXXXX" or "+1 (XXX) XXX-XXXX"). If it contains "Data Missing" or "missing value", keep it as "Data Missing".
2. Capitalize Name, Designation, and Office Name using proper Title Case.
3. Clean spelling errors, formatting typos, and standardize addresses. If a field value is "missing value", replace it with "Data Missing".
4. Return ONLY a valid JSON object matching the exact keys: name, designation, phone, email, address, officeName, officeDetails. Do not include markdown code block syntax (like \`\`\`json) or any extra conversational text.`;

  const response = await generateAIContent({ userId, prompt, provider });

  if (!response.success) {
    return {
      name: cardFields.name === "missing value" ? "Data Missing" : cardFields.name,
      designation: cardFields.designation === "missing value" ? "Data Missing" : cardFields.designation,
      phone: cardFields.phone === "missing value" ? "Data Missing" : cardFields.phone,
      email: cardFields.email === "missing value" ? "Data Missing" : cardFields.email,
      address: cardFields.address === "missing value" ? "Data Missing" : cardFields.address,
      officeName: cardFields.officeName === "missing value" ? "Data Missing" : cardFields.officeName,
      officeDetails: cardFields.officeDetails === "missing value" ? "Data Missing" : cardFields.officeDetails,
    };
  }

  try {
    let cleanJson = response.content.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error("Failed to parse AI response JSON:", response.content, err);
    return {
      name: cardFields.name === "missing value" ? "Data Missing" : cardFields.name,
      designation: cardFields.designation === "missing value" ? "Data Missing" : cardFields.designation,
      phone: cardFields.phone === "missing value" ? "Data Missing" : cardFields.phone,
      email: cardFields.email === "missing value" ? "Data Missing" : cardFields.email,
      address: cardFields.address === "missing value" ? "Data Missing" : cardFields.address,
      officeName: cardFields.officeName === "missing value" ? "Data Missing" : cardFields.officeName,
      officeDetails: cardFields.officeDetails === "missing value" ? "Data Missing" : cardFields.officeDetails,
    };
  }
}
