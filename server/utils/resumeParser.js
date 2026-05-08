const fs = require("fs");
const pdfParse = require("pdf-parse");

async function parseResume(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);

    return pdfData.text
      .replace(/\s+/g, " ")
      .trim();
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error("Could not parse PDF resume");
  }
}

module.exports = { parseResume };