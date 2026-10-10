import { source } from "@/lib/source";
import { createFromSource } from "fumadocs-core/search/server";

// Orama has no Traditional Chinese tokenizer preset; fall back to the default analyzer.
export const { GET } = createFromSource(source, {
  localeMap: { "zh-TW": { language: "english" } },
});
