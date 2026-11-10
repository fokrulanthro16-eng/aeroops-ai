/**
 * ==============================================================================
 * AEROOPS AI — 1,000+ QUESTION & MODEL ANSWER EXPORT API ROUTE
 * Endpoint: GET /api/pitch-sim/export-qa
 * Exports the complete due diligence matrix as downloadable Markdown (.md)
 * or print-ready PDF/HTML format.
 * ==============================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { generateMarkdownDossier, generateHtmlDossier } from "@/lib/pitch-sim/export-dossier";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = (searchParams.get("format") || "md").toLowerCase();

    if (format === "html" || format === "pdf") {
      const htmlContent = generateHtmlDossier();
      return new NextResponse(htmlContent, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    // Default: Markdown file download
    const markdownContent = generateMarkdownDossier();
    return new NextResponse(markdownContent, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": 'attachment; filename="AeroOps-AI-VC-1000QA-Dossier.md"',
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("[Export QA API Error]:", error);
    return NextResponse.json({ error: "Failed to generate dossier export" }, { status: 500 });
  }
}
