import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { spawn } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { TRPCError } from "@trpc/server";

/**
 * Export Router - Handles PNG/PDF conversion via Python backend
 * Bypasses html2canvas OKLCH color parsing issues
 */
export const exportRouter = router({
  /**
   * Export card to PNG format
   * Server-side conversion ensures compatibility and offline capability
   */
  exportPNG: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        designation: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        address: z.string().optional(),
        officeName: z.string().optional(),
        officeDetails: z.string().optional(),
        vcard: z.string().optional(),
        aspectRatio: z.enum(["3:4", "16:9"]).default("3:4"),
        headshot: z.string().optional(), // Base64 encoded image
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Prepare card data
        const cardData = {
          name: input.name,
          designation: input.designation || "",
          phone: input.phone || "",
          email: input.email || "",
          address: input.address || "",
          office_name: input.officeName || "",
          office_details: input.officeDetails || "",
          vcard: input.vcard || "",
          headshot: input.headshot || "",
        };

        // Create temporary JSON file
        const tmpDir = tmpdir();
        const jsonFile = join(tmpDir, `card-${Date.now()}.json`);
        const pngFile = jsonFile.replace(".json", ".png");

        writeFileSync(jsonFile, JSON.stringify(cardData));

        // Execute Python converter
        const result = await executeCardConverter(
          jsonFile,
          "png",
          input.aspectRatio
        );

        if (!result.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `PNG conversion failed: ${result.error}`,
          });
        }

        // Read PNG file
        const fs = await import("fs").then((m) => m.promises);
        const pngBuffer = await fs.readFile(pngFile);

        // Cleanup
        try {
          unlinkSync(jsonFile);
          unlinkSync(pngFile);
        } catch (e) {
          // Ignore cleanup errors
        }

        // Return base64 encoded PNG
        return {
          success: true,
          data: pngBuffer.toString("base64"),
          mimeType: "image/png",
        };
      } catch (error) {
        console.error("PNG export error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to export PNG",
        });
      }
    }),

  /**
   * Export card to PDF format
   * Server-side conversion ensures compatibility and offline capability
   */
  exportPDF: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        designation: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        address: z.string().optional(),
        officeName: z.string().optional(),
        officeDetails: z.string().optional(),
        vcard: z.string().optional(),
        aspectRatio: z.enum(["3:4", "16:9"]).default("3:4"),
        headshot: z.string().optional(), // Base64 encoded image
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Prepare card data
        const cardData = {
          name: input.name,
          designation: input.designation || "",
          phone: input.phone || "",
          email: input.email || "",
          address: input.address || "",
          office_name: input.officeName || "",
          office_details: input.officeDetails || "",
          vcard: input.vcard || "",
          headshot: input.headshot || "",
        };

        // Create temporary JSON file
        const tmpDir = tmpdir();
        const jsonFile = join(tmpDir, `card-${Date.now()}.json`);
        const pdfFile = jsonFile.replace(".json", ".pdf");

        writeFileSync(jsonFile, JSON.stringify(cardData));

        // Execute Python converter
        const result = await executeCardConverter(
          jsonFile,
          "pdf",
          input.aspectRatio
        );

        if (!result.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `PDF conversion failed: ${result.error}`,
          });
        }

        // Read PDF file
        const fs = await import("fs").then((m) => m.promises);
        const pdfBuffer = await fs.readFile(pdfFile);

        // Cleanup
        try {
          unlinkSync(jsonFile);
          unlinkSync(pdfFile);
        } catch (e) {
          // Ignore cleanup errors
        }

        // Return base64 encoded PDF
        return {
          success: true,
          data: pdfBuffer.toString("base64"),
          mimeType: "application/pdf",
        };
      } catch (error) {
        console.error("PDF export error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to export PDF",
        });
      }
    }),
});

/**
 * Execute Python card converter
 * Spawns Python process to convert card data to image format
 */
async function executeCardConverter(
  jsonFile: string,
  format: "png" | "pdf",
  aspectRatio: string
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const pythonScript = join(
      process.cwd ? process.cwd() : "/home/ubuntu/glasscard-ai",
      "server",
      "card-converter.py"
    );

    const proc = spawn("python3", [pythonScript, jsonFile, format, aspectRatio], {
      timeout: 30000, // 30 second timeout
    });

    let stderr = "";

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve({ success: true });
      } else {
        resolve({
          success: false,
          error: stderr || `Process exited with code ${code}`,
        });
      }
    });

    proc.on("error", (error) => {
      resolve({
        success: false,
        error: error.message,
      });
    });
  });
}
