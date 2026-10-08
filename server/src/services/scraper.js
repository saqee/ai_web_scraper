import axios from "axios";
import * as cheerio from "cheerio";

// Small safety check for this learning project.
// Production code needs stronger SSRF/private-IP protection.
function validateUrl(rawUrl) {
  const url = new URL(rawUrl);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only http:// and https:// URLs are allowed.");
  }

  const blockedHosts = ["localhost", "127.0.0.1", "0.0.0.0", "::1"];
  if (blockedHosts.includes(url.hostname)) {
    throw new Error("Localhost/private development targets are blocked.");
  }

  return url.toString();
}

export async function scrapeWebsite(rawUrl) {
  const url = validateUrl(rawUrl);

  // Axios downloads the raw HTML.
  const response = await axios.get(url, {
    timeout: 15000,
    maxContentLength: 2_000_000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; LearningRAGBot/1.0; educational-project)",
    },
  });

  // Cheerio parses the HTML and gives jQuery-like selectors.
  const $ = cheerio.load(response.data);

  // Remove noisy elements before taking page text.
  $("script, style, noscript, svg, iframe, nav, footer").remove();

  const title = $("title").first().text().trim();
  const content = $("body").text().replace(/\s+/g, " ").trim();

  if (!content) {
    throw new Error("No readable text was found on this page.");
  }

  return { url, title, content };
}
