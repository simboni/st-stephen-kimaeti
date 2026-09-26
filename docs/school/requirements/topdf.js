/* Convert the generated .docx into a print-ready PDF.
   Reads word/document.xml (which this project produced, so its shape is known)
   and renders it through headless Chromium. */
const fs = require("fs");
const { execSync } = require("child_process");
const { chromium } = require("playwright-core");

const W = "w:";
execSync("rm -rf unpacked && unzip -q St-Stephens-Requirements.docx -d unpacked");
const xml = fs.readFileSync("unpacked/word/document.xml", "utf8");

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ---- minimal OOXML walker (only the constructs this document uses) ---- */
function textOf(frag) {
  const out = [];
  const re = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g;
  let m;
  while ((m = re.exec(frag))) out.push(m[1]);
  return out.join("")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}

function renderParagraph(frag) {
  const txt = textOf(frag).trim();
  const style = (frag.match(/<w:pStyle w:val="([^"]+)"/) || [])[1] || "";
  const isBullet = /<w:numPr>/.test(frag);
  const isBreak = /<w:br w:type="page"\/>|<w:lastRenderedPageBreak/.test(frag);
  const bold = /<w:b\/>/.test(frag);
  const italic = /<w:i\/>/.test(frag);
  const color = (frag.match(/<w:color w:val="([^"]+)"/) || [])[1];
  const sizeHalf = parseInt((frag.match(/<w:sz w:val="(\d+)"/) || [])[1] || "21", 10);

  if (!txt && !isBreak) return "";
  if (isBreak && !txt) return '<div class="pagebreak"></div>';

  if (/^Heading1$/i.test(style)) return `<h1>${esc(txt)}</h1>`;
  if (/^Heading2$/i.test(style)) return `<h2>${esc(txt)}</h2>`;
  if (/^Heading3$/i.test(style)) return `<h3>${esc(txt)}</h3>`;
  if (isBullet) return `<li>${esc(txt)}</li>`;

  // Callout notes are the italic grey ones.
  if (italic && color === "444444") return `<p class="note">${esc(txt)}</p>`;
  if (color === "B00020") return `<p class="required">${esc(txt)}</p>`;
  if (sizeHalf >= 40) return `<p class="cover-title">${esc(txt)}</p>`;
  if (sizeHalf >= 28) return `<p class="cover-sub">${esc(txt)}</p>`;
  if (bold) return `<p><strong>${esc(txt)}</strong></p>`;
  return `<p>${esc(txt)}</p>`;
}

function renderTable(frag) {
  const rows = frag.split(/<w:tr[\s>]/).slice(1);
  // Carry the column widths across; without them the browser auto-sizes and
  // long question labels squeeze the answer boxes down to nothing.
  const cols = [...frag.matchAll(/<w:gridCol w:w="(\d+)"/g)].map((m) => +m[1]);
  let colgroup = "";
  if (cols.length) {
    const total = cols.reduce((a, b) => a + b, 0);
    colgroup = "<colgroup>" +
      cols.map((c) => `<col style="width:${((c / total) * 100).toFixed(2)}%">`).join("") +
      "</colgroup>";
  }
  let html = "<table>" + colgroup;
  rows.forEach((rowFrag, ri) => {
    const cells = rowFrag.split(/<w:tc[\s>]/).slice(1);
    const isHeader = /<w:tblHeader/.test(rowFrag) || ri === 0 && /EEF2F8/.test(cells.join(""));
    html += "<tr>";
    for (const c of cells) {
      const t = textOf(c).trim();
      const shaded = /w:fill="EEF2F8"/.test(c);
      const tag = shaded ? "th" : "td";
      html += `<${tag}${t ? "" : ' class="blank"'}>${esc(t) || "&nbsp;"}</${tag}>`;
    }
    html += "</tr>";
  });
  return html + "</table>";
}

/* Walk the body in document order. */
const body = xml.slice(xml.indexOf("<w:body>"), xml.lastIndexOf("</w:body>"));
const pieces = [];
const re = /<w:(p|tbl)(?:\s[^>]*)?>([\s\S]*?)<\/w:\1>/g;
let m, depth;
// Top-level only: skip paragraphs nested inside tables by tracking table spans.
let idx = 0;
while (idx < body.length) {
  const nextP = body.indexOf("<w:p ", idx) === -1 ? body.indexOf("<w:p>", idx) : Math.min(...[body.indexOf("<w:p ", idx), body.indexOf("<w:p>", idx)].filter((x) => x !== -1));
  const nextT = body.indexOf("<w:tbl>", idx);
  if (nextT !== -1 && (nextP === -1 || nextT < nextP)) {
    const end = body.indexOf("</w:tbl>", nextT) + "</w:tbl>".length;
    pieces.push(renderTable(body.slice(nextT, end)));
    idx = end;
  } else if (nextP !== -1 && isFinite(nextP)) {
    // find matching close accounting for no nesting of w:p
    const end = body.indexOf("</w:p>", nextP) + "</w:p>".length;
    pieces.push(renderParagraph(body.slice(nextP, end)));
    idx = end;
  } else break;
}

// Wrap consecutive <li> in <ul>
let html = pieces.join("\n")
  .replace(/(?:<li>[\s\S]*?<\/li>\s*)+/g, (b) => `<ul>${b}</ul>`);

const page = `<!doctype html><html><head><meta charset="utf-8"><style>
  @page { size: A4; margin: 18mm 16mm; }
  body { font-family: "DejaVu Sans", Arial, sans-serif; font-size: 10.5pt; color:#111; line-height:1.45; }
  h1 { font-size: 19pt; color:#1F3A63; margin: 0 0 14px; padding-bottom:6px;
       border-bottom: 2px solid #C9A227; page-break-before: always; page-break-after: avoid; }
  h1:first-of-type { page-break-before: avoid; }
  h2 { font-size: 13.5pt; color:#1F3A63; margin: 20px 0 8px; page-break-after: avoid; }
  h3 { font-size: 11.5pt; color:#333; margin: 14px 0 6px; page-break-after: avoid; }
  p { margin: 0 0 8px; }
  ul { margin: 0 0 10px 18px; padding:0; } li { margin-bottom:4px; }
  .note { border-left: 3px solid #C9A227; background:#FDF9EC; padding:7px 10px;
          font-style: italic; color:#444; font-size:9.5pt; margin:8px 0 14px; }
  .required { color:#B00020; font-weight:bold; font-size:9.5pt; margin:-4px 0 8px; }
  .cover-title { font-size: 26pt; font-weight:bold; color:#1F3A63; text-align:center; margin:130px 0 4px; }
  .cover-sub { font-size: 15pt; color:#555; text-align:center; margin:0 0 26px; }
  table { border-collapse: collapse; width: 100%; table-layout: fixed; margin: 6px 0 16px;
          page-break-inside: auto; font-size: 9.5pt; }
  tr { page-break-inside: avoid; }
  th, td { border: 1px solid #A9B4C4; padding: 5px 7px; text-align: left; vertical-align: top; word-wrap: break-word; }
  th { background: #EEF2F8; font-weight: bold; }
  td.blank { height: 26px; }
</style></head><body>${html}</body></html>`;

fs.writeFileSync("document.html", page);

(async () => {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const p = await browser.newPage();
  await p.setContent(page, { waitUntil: "load" });
  await p.pdf({
    path: "St-Stephens-Requirements.pdf",
    format: "A4",
    printBackground: true,
    margin: { top: "18mm", bottom: "18mm", left: "16mm", right: "16mm" },
    displayHeaderFooter: true,
    headerTemplate: `<div style="font-size:7pt;color:#888;width:100%;padding:0 16mm;text-align:right;">St Stephen's School — Requirements &amp; Data Collection</div>`,
    footerTemplate: `<div style="font-size:7pt;color:#888;width:100%;padding:0 16mm;text-align:center;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`,
  });
  await browser.close();
  console.log("PDF written");
})();
