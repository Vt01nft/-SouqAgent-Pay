import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const inputPath = path.join(root, "docs", "final-submission.md");
const htmlPath = path.join(root, "docs", "final-submission.html");
const pdfPath = path.join(root, "docs", "final-submission.pdf");
const chromeCandidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function inlineMarkdown(value) {
  let escaped = escapeHtml(value);
  escaped = escaped.replace(/`([^`]+)`/g, "<code>$1</code>");
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  escaped = escaped.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (_match, alt, src) => {
      const imagePath = path.resolve(path.dirname(inputPath), src);
      return `<figure><img src="${pathToFileURL(imagePath).href}" alt="${escapeHtml(alt)}" /><figcaption>${escapeHtml(alt)}</figcaption></figure>`;
    },
  );
  escaped = escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1">$1</a>',
  );
  return escaped;
}

function architectureDiagram() {
  const steps = [
    ["SME Owner", "SouqAgent Pay UI"],
    ["Owner Access Guard", "Agent Orchestrator API"],
    ["Budget Policy Engine", "x402 Seller API"],
    ["Supplier Risk Result", "Circle Gateway / Nanopayments Model"],
    ["Circle Wallets", "submitDeliverable(uint256,string)"],
    ["Arc Testnet", "ArcJobEscrow.sol"],
    ["Supabase Task Ledger", "Shareable Receipt Page"],
  ];

  return `
    <div class="diagram">
      ${steps
        .map(
          (row) => `
            <div class="diagram-row">
              <div>${row[0]}</div>
              <span></span>
              <div>${row[1]}</div>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function markdownToHtml(markdown) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let paragraph = [];
  let list = [];
  let inCode = false;
  let codeLanguage = "";
  let code = [];

  function flushParagraph() {
    if (paragraph.length) {
      html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  }

  function flushList() {
    if (list.length) {
      html.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
      list = [];
    }
  }

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCode) {
        if (codeLanguage === "mermaid") {
          html.push(architectureDiagram());
        } else {
          html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
        }
        inCode = false;
        codeLanguage = "";
        code = [];
      } else {
        flushParagraph();
        flushList();
        inCode = true;
        codeLanguage = line.replace("```", "").trim();
      }
      continue;
    }

    if (inCode) {
      code.push(line);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      html.push(`<h${heading[1].length}>${inlineMarkdown(heading[2])}</h${heading[1].length}>`);
      continue;
    }

    const bullet = line.match(/^-\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      list.push(bullet[1]);
      continue;
    }

    const numbered = line.match(/^\d+\.\s+(.+)$/);
    if (numbered) {
      flushParagraph();
      list.push(numbered[1]);
      continue;
    }

    flushList();
    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();
  return html.join("\n");
}

const markdown = fs.readFileSync(inputPath, "utf8");
const body = markdownToHtml(markdown);
const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>SouqAgent Pay Final Submission</title>
    <style>
      @page { margin: 18mm 16mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: #111111;
        background: #ffffff;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 11.2px;
        line-height: 1.48;
      }
      h1 {
        margin: 0 0 14px;
        padding: 18px 18px 16px;
        color: #111111;
        background: #ffd80d;
        border: 1px solid #111111;
        border-radius: 8px;
        font-size: 28px;
        line-height: 1.05;
      }
      h2 {
        margin: 20px 0 8px;
        padding-bottom: 5px;
        border-bottom: 1px solid #d7d7d0;
        font-size: 17px;
      }
      h3 {
        margin: 14px 0 6px;
        font-size: 13px;
      }
      p { margin: 0 0 8px; }
      ul {
        margin: 6px 0 10px 18px;
        padding: 0;
      }
      li { margin: 3px 0; }
      code {
        padding: 1px 4px;
        border-radius: 4px;
        background: #f2f2ed;
        font-family: Consolas, "Courier New", monospace;
        font-size: 10px;
      }
      a { color: #111111; text-decoration: underline; overflow-wrap: anywhere; }
      figure {
        margin: 8px 0 14px;
        padding: 10px;
        border: 1px solid #d7d7d0;
        border-radius: 8px;
        background: #fbfbfa;
        break-inside: avoid;
      }
      figure img {
        display: block;
        width: 100%;
        height: auto;
      }
      figcaption {
        margin-top: 6px;
        color: #55554f;
        font-size: 10px;
        text-align: center;
      }
      .diagram {
        display: grid;
        gap: 7px;
        margin: 8px 0 12px;
        padding: 12px;
        border: 1px solid #d7d7d0;
        border-radius: 8px;
        background: #fbfbfa;
      }
      .diagram-row {
        display: grid;
        grid-template-columns: 1fr 28px 1fr;
        align-items: center;
        gap: 8px;
      }
      .diagram-row div {
        min-height: 30px;
        padding: 7px 8px;
        border: 1px solid #111111;
        border-radius: 7px;
        background: #ffffff;
        font-weight: 700;
      }
      .diagram-row span {
        height: 2px;
        background: #111111;
        position: relative;
      }
      .diagram-row span::after {
        content: "";
        position: absolute;
        right: -1px;
        top: -4px;
        border-left: 7px solid #111111;
        border-top: 5px solid transparent;
        border-bottom: 5px solid transparent;
      }
    </style>
  </head>
  <body>${body}</body>
</html>`;

fs.writeFileSync(htmlPath, html);

const chromePath = chromeCandidates.find((candidate) => fs.existsSync(candidate));

if (!chromePath) {
  throw new Error("Chrome or Edge was not found for PDF generation.");
}

execFileSync(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--no-pdf-header-footer",
  `--print-to-pdf=${pdfPath}`,
  pathToFileURL(htmlPath).href,
], { stdio: "inherit" });

console.log(pdfPath);
