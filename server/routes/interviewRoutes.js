const express = require("express");
const multer = require("multer");
const fs = require("fs");

const { askAI } = require("../utils/ai");
const { parseResume } = require("../utils/resumeParser");

const {
  resumeAnalysisPrompt,
  questionPrompt,
  evaluationPrompt,
  finalFeedbackPrompt
} = require("../utils/prompts");

const router = express.Router();

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const upload = multer({ dest: "uploads/" });

router.post("/analyze-resume", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No resume file uploaded" });
    }

    console.log("Uploaded file:", req.file);

    const resumeText = await parseResume(req.file.path);

    if (!resumeText || resumeText.length < 20) {
      return res.status(400).json({
        message: "Resume text could not be extracted properly"
      });
    }

    console.log("Resume text extracted successfully");

    const analysis = await askAI(resumeAnalysisPrompt(resumeText));

    return res.json({
      resumeText,
      analysis
    });
  } catch (error) {
    console.error("Resume analysis error:", error);

    return res.status(500).json({
      message: "Resume analysis failed",
      error: error.message
    });
  }
});

router.post("/generate-question", async (req, res) => {
  try {
    const { resumeAnalysis, selectedRole, previousAnswers } = req.body;

    const question = await askAI(
      questionPrompt(resumeAnalysis, selectedRole, previousAnswers || [])
    );

    res.json(question);
  } catch (error) {
    console.error("Question generation error:", error);

    res.status(500).json({
      message: "Question generation failed",
      error: error.message
    });
  }
});

router.post("/evaluate-answer", async (req, res) => {
  try {
    const { question, answer, selectedRole, expectedDepth, note } = req.body;
    const evaluation = await askAI(
        evaluationPrompt(
            question + "\nExpected depth points: " + JSON.stringify(expectedDepth || []),
            answer + "\nEvaluator note: " + (note || ""),
            selectedRole
          )    );

    res.json(evaluation);
  } catch (error) {
    console.error("Answer evaluation error:", error);

    res.status(500).json({
      message: "Answer evaluation failed",
      error: error.message
    });
  }
});

router.post("/final-feedback", async (req, res) => {
  try {
    const { sessionData } = req.body;

    const feedback = await askAI(finalFeedbackPrompt(sessionData));

    res.json(feedback);
  } catch (error) {
    console.error("Final feedback error:", error);

    res.status(500).json({
      message: "Final feedback failed",
      error: error.message
    });
  }
});

module.exports = router;