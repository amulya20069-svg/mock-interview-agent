function resumeAnalysisPrompt(resumeText) {
    return `
  Analyze this resume like a recruiter and interview designer.
  
  Do NOT simply match keywords.
  Infer roles using skills evidence, project complexity, tools used, seniority level,
  domain exposure, missing areas, and practical employability.
  
  Resume:
  ${resumeText}
  
  Return JSON:
  {
    "candidateSummary": "short summary",
    "skills": ["skill1", "skill2"],
    "projects": [
      {
        "name": "project name",
        "whatItShows": "what this project proves"
      }
    ],
    "recommendedRoles": [
      {
        "role": "role name",
        "matchScore": 0-100,
        "reason": "why this role fits",
        "focusAreas": ["area1", "area2"],
        "weakAreasToProbe": ["area1", "area2"]
      }
    ]
  }
  `;
  }
  
  function questionPrompt(resumeAnalysis, selectedRole, previousAnswers) {
    return `
  You are conducting a realistic mock interview.
  
  Candidate analysis:
  ${JSON.stringify(resumeAnalysis)}
  
  Selected role:
  ${selectedRole}
  
  Previous answers:
  ${JSON.stringify(previousAnswers)}
  
  Generate ONE interview question.
  
  Rules:
  - Question must be specific to the candidate resume.
  - Connect it to their real projects or skills.
  - Do not ask generic textbook questions.
  - If previous answer was weak, ask a simpler but related follow-up.
  - If previous answer was strong, increase depth.
  - Ask practical interview-style questions.
  
  Return JSON:
  {
    "question": "question text",
    "difficulty": "easy | medium | hard",
    "whyAsked": "why this question was selected",
    "expectedDepth": ["point1", "point2", "point3"]
  }
  `;
  }
  
  function evaluationPrompt(question, answer, selectedRole) {
    return `
  Evaluate this candidate's interview answer.
  
  Role:
  ${selectedRole}
  
  Question:
  ${question}
  
  Candidate transcript:
  ${answer}
  
  Important evaluation rules:
  - Do NOT score by word count.
  - Be tolerant of speech-to-text mistakes.
  - Technical terms may be mis-transcribed.
    Example: "jwt" may appear as "J double tea", "mongod b", "mongo DB", etc.
  - Give credit if the meaning is close even if wording is imperfect.
  - Score based on conceptual correctness, practical understanding, and depth.
  - Do not punish grammar heavily.
  - If answer is short but conceptually correct, give a fair score.
  - If answer gives partial but relevant explanation, score medium, not very low.
  - Only give low score if the answer is unrelated, wrong, or empty.
  
  Scoring guide:
  90-100 = correct, deep, practical, with examples/tradeoffs
  75-89 = mostly correct, some depth, minor missing points
  60-74 = partially correct, understands basics but lacks depth
  40-59 = weak but related
  0-39 = unrelated or mostly incorrect
  
  Return JSON:
  {
    "technicalScore": 0-100,
    "depthScore": 0-100,
    "clarityScore": 0-100,
    "semanticMatchScore": 0-100,
    "strengths": ["point1", "point2"],
    "mistakes": ["point1", "point2"],
    "missingPoints": ["point1", "point2"],
    "improvedAnswer": "a better interview-style answer",
    "nextDifficulty": "easier | same | harder"
  }
  `;
  }
  
  function finalFeedbackPrompt(sessionData) {
    return `
  Create final mock interview feedback using BOTH answer evaluation and multimodal signals.
  
  Session data:
  ${JSON.stringify(sessionData)}
  
  Each answer contains:
  - evaluation: technicalScore, depthScore, clarityScore
  - audioMetrics: fillerCount, wordCount, confidenceScore
  - videoMetrics: faceVisible, eyeContactScore, postureScore, engagementScore, cheatingFlags
  
  Important:
  - Clearly mention technical performance.
  - Clearly mention communication confidence.
  - Clearly mention webcam-based eye contact and posture.
  - Clearly mention if face was not visible or candidate looked away.
  - Do not give generic feedback.
  - Use the actual scores from audioMetrics and videoMetrics.
  - If technical answer was decent but transcript may have speech recognition mistakes, mention that score may be affected by transcription quality.
  
  Return JSON:
  {
    "overallScore": 0-100,
    "technicalFeedback": "specific technical feedback",
    "communicationFeedback": "specific feedback using audio metrics",
    "confidenceFeedback": "specific feedback using confidence score, eye contact score, posture score, engagement score",
    "webcamFeedback": "specific webcam-based feedback",
    "cheatingOrAttentionFlags": ["flag1", "flag2"],
    "roleReadiness": "ready | needs practice | beginner",
    "topImprovements": ["point1", "point2", "point3"],
    "practicePlan": ["step1", "step2", "step3"]
  }
  `;
  }
  
  module.exports = {
    resumeAnalysisPrompt,
    questionPrompt,
    evaluationPrompt,
    finalFeedbackPrompt
  };