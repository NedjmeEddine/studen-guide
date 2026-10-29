import Prism from "prismjs";
import { escapeHtml } from "@/dialect/markdown";

// Attach Prism to globalThis in Node SSR / browser before loading UMD grammars
if (typeof globalThis !== "undefined") {
  (globalThis as unknown as { Prism: typeof Prism }).Prism = Prism;
}

let grammarsPromise: Promise<void> | null = null;

export async function ensurePrismLanguages(): Promise<void> {
  if (!grammarsPromise) {
    grammarsPromise = (async () => {
      try {
        if (typeof globalThis !== "undefined") {
          (globalThis as unknown as { Prism: typeof Prism }).Prism = Prism;
        }
        await import("prismjs/components/prism-clike.js");
        await Promise.all([
          import("prismjs/components/prism-c.js"),
          import("prismjs/components/prism-cpp.js"),
          import("prismjs/components/prism-java.js"),
          import("prismjs/components/prism-python.js"),
          import("prismjs/components/prism-bash.js"),
          import("prismjs/components/prism-sql.js"),
          import("prismjs/components/prism-json.js"),
          import("prismjs/components/prism-yaml.js"),
        ]);
      } catch (e) {
        console.warn("Prism grammar load warning:", e);
      }
    })();
  }
  return grammarsPromise;
}

export function highlightCode(code: string, lang: string): string {
  const normalized = lang.toLowerCase();
  const grammar =
    Prism.languages[normalized] ||
    (normalized === "js" || normalized === "javascript"
      ? Prism.languages.javascript
      : normalized === "ts" || normalized === "typescript"
        ? Prism.languages.typescript
        : normalized === "py"
          ? Prism.languages.python
          : normalized === "sh" || normalized === "shell"
            ? Prism.languages.bash
            : null);

  if (grammar) {
    try {
      return Prism.highlight(code, grammar, normalized);
    } catch {
      return escapeHtml(code);
    }
  }
  return escapeHtml(code);
}
