import MarkdownIt from "markdown-it";
import katex from "katex";
import "katex/contrib/mhchem";
import { uniqueId } from "./parse";

// html:false is mandatory — sheet content never becomes raw HTML.
const md = new MarkdownIt({ html: false, linkify: true, typographer: false });

md.renderer.rules.heading_open = (tokens, idx, opts, env, self) => {
  const t = tokens[idx];
  const seen = (env as { headingSeen?: Map<string, number> } | undefined)?.headingSeen;
  if (t.tag === "h2" && seen) {
    const text = tokens[idx + 1]?.content ?? "";
    t.attrSet("id", uniqueId(text, seen));
  }
  return self.renderToken(tokens, idx, opts);
};
function renderMath(tex: string, display: boolean) {
  try {
    return katex.renderToString(tex, {
      displayMode: display,
      throwOnError: false,
      strict: "ignore",
      trust: false,
    });
  } catch {
    return `<code class="ss-math-error">${escapeHtml(tex)}</code>`;
  }
}

export function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

/** Math protection BEFORE markdown-it (otherwise `_` inside $…$ becomes emphasis). */
export function protectMath(src: string) {
  const store: string[] = [];
  const put = (html: string) => `%%M${store.push(html) - 1}%%`;
  let out = src.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => put(renderMath(tex, true)));
  out = out.replace(
    /(^|[^\\$])\$([^\s$](?:[^$\n]*?[^\s\\$])?)\$/g,
    (_, pre, tex) => pre + put(renderMath(tex, false)),
  );
  return { text: out, store };
}
export function releaseMath(html: string, store: string[]) {
  return html.replace(/%%M(\d+)%%/g, (_, i) => store[+i] ?? "");
}

/** Render a markdown chunk. Pass a shared `seen` map so h2 ids match the TOC. */
export function renderMd(src: string, seen?: Map<string, number>) {
  const { text, store } = protectMath(src);
  const html = md.render(text, { headingSeen: seen });
  return releaseMath(html, store);
}
export function renderInline(src: string) {
  const { text, store } = protectMath(src);
  return releaseMath(md.renderInline(text), store);
}
