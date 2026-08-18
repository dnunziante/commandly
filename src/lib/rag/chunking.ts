import "server-only";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export type ExtractedPage = { pageNumber: number | null; text: string };
export type KnowledgeChunk = { content: string; pageNumber: number | null; section: string | null };

export async function extractDocumentPages(file: File): Promise<ExtractedPage[]> {
  if (file.type === "application/pdf") {
    const parser = new PDFParse({ data: new Uint8Array(await file.arrayBuffer()) });
    try {
      const output = await parser.getText();
      return output.pages.map((page) => ({ pageNumber: page.num, text: page.text }));
    } finally {
      await parser.destroy();
    }
  }
  if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.name.toLowerCase().endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer: Buffer.from(await file.arrayBuffer()) });
    return [{ pageNumber: null, text: result.value }];
  }
  if (["text/plain", "text/markdown"].includes(file.type)) return [{ pageNumber: null, text: await file.text() }];
  throw new Error("AI indexing supports PDF, Word, Markdown, and text files. The original file was saved but was not indexed.");
}

function sectionFor(text: string) {
  const candidate = text.split(/\r?\n/).map((line) => line.trim()).find((line) => line.length > 2 && line.length < 110 && (line === line.toUpperCase() || /^[A-Z][A-Za-z0-9 /&:()-]+$/.test(line)));
  return candidate || null;
}

export function makeKnowledgeChunks(pages: ExtractedPage[]): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];
  for (const page of pages) {
    const text = page.text.replace(/\s+/g, " ").trim();
    if (!text) continue;
    const section = sectionFor(page.text);
    const size = 1200;
    const overlap = 180;
    for (let start = 0; start < text.length; start += size - overlap) {
      const content = text.slice(start, start + size).trim();
      if (content.length >= 80) chunks.push({ content, pageNumber: page.pageNumber, section });
      if (start + size >= text.length) break;
    }
  }
  if (!chunks.length) throw new Error("No readable text was found in this document.");
  if (chunks.length > 240) throw new Error("This document is too large for secure synchronous indexing. Split it into smaller documents and upload again.");
  return chunks;
}
