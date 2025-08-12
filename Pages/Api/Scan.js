import { JSDOM } from "jsdom";
import axe from "axe-core";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ error: "Missing url" });

    const u = new URL(url);
    if (!["http:", "https:"].includes(u.protocol)) return res.status(400).json({ error: "Unsupported protocol" });

    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), 12000);
    const r = await fetch(u.toString(), {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "SiteOK1Bot/1.0" }
    }).catch((e) => { clearTimeout(to); throw e; });
    clearTimeout(to);
    if (!r.ok) return res.status(400).json({ error: `HTTP ${r.status}` });
    const html = await r.text();

    const dom = new JSDOM(html, { url: u.toString(), pretendToBeVisual: true });
    const { window } = dom;
    // eslint-disable-next-line no-eval
    window.eval(axe.source);
    const results = await window.axe.run(window.document, {
      runOnly: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
      resultTypes: ["violations", "incomplete"]
    });

    const summary = {
      url: u.toString(),
      violations: results.violations.length,
      incomplete: results.incomplete.length,
      byImpact: results.violations.reduce((acc, v) => {
        const k = v.impact || "unknown";
        acc[k] = (acc[k] || 0) + 1;
        return acc;
      }, {})
    };
    res.status(200).json({ summary, results });
  } catch (e) {
    res.status(400).json({ error: e?.message || "Unknown error" });
  }
}
