// Shared palette + fonts for every generated SVG.
// Colors come from the "Espresso" palette on joeleboube.com.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export const palettes = {
  dark: {
    bg: "#1c100b", bgDeep: "#3a160c", panel: "#24150f", border: "#4a2a1a",
    text: "#f6ead8", muted: "#c4ab8f", ember: "#ec6a35", honey: "#e3a332",
    rust: "#8a3517", olive: "#7d8a3c",
  },
  light: {
    bg: "#f8f1e5", bgDeep: "#f0e6d4", panel: "#fbf6ee", border: "#dccbb0",
    text: "#1d1511", muted: "#6e5440", ember: "#b34119", honey: "#a8701c",
    rust: "#8a3517", olive: "#4b5728",
  },
};

const b64 = (p) => readFileSync(join(root, p)).toString("base64");

export function fontFaceCss() {
  return `@font-face{font-family:"Bricolage";src:url(data:font/woff2;base64,${b64("assets/fonts/bricolage-subset.woff2")}) format("woff2");font-weight:200 800;}
@font-face{font-family:"DMMono";src:url(data:font/woff2;base64,${b64("assets/fonts/dmmono-medium-subset.woff2")}) format("woff2");font-weight:500;}`;
}

export const SANS = `"Bricolage","Segoe UI",Helvetica,Arial,sans-serif`;
export const MONO = `"DMMono",ui-monospace,Menlo,Consolas,monospace`;
export const MONO_ADVANCE = 0.6; // em per glyph for DM Mono

export const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
