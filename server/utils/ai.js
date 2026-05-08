const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

function extractJSON(text) {
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    console.log("Raw AI text:", text);
    throw new Error("AI did not return JSON");
  }

  const jsonString = text.slice(firstBrace, lastBrace + 1);
  return JSON.parse(jsonString);
}

async function askAI(prompt) {
  try {
    console.log("Groq key exists:", !!process.env.GROQ_API_KEY);

    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is missing in .env");
    }

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an expert interview agent. Return only valid JSON. No markdown."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3
    });

    const aiText = response.choices[0].message.content;
    console.log("AI raw response:", aiText);

    return extractJSON(aiText);
  } catch (error) {
    console.error("AI Error Full:", error);
    throw new Error(error.message || "AI request failed");
  }
}

module.exports = { askAI };