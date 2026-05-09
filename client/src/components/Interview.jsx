import { useEffect, useRef, useState } from "react";
const API_URL = "https://ferment-frisbee-karate.ngrok-free.dev";

function Interview({
  resumeAnalysis,
  selectedRole,
  interviewMode,
  sessionData,
  setSessionData,
  setFinalFeedback,
  setStep
}) {
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [questionObj, setQuestionObj] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [typingStartTime, setTypingStartTime] = useState(null);
  const [typingMetrics, setTypingMetrics] = useState({
  timeTakenSeconds: 0,
  typingSpeedWPM: 0,
  backspaceCount: 0
});

  const [audioMetrics, setAudioMetrics] = useState({
    fillerCount: 0,
    wordCount: 0,
    confidenceScore: 80
  });

  const [videoMetrics, setVideoMetrics] = useState({
    faceVisible: false,
    eyeContactScore: 0,
    postureScore: 0,
    engagementScore: 0,
    cheatingFlags: []
  });

  const videoRef = useRef(null);
  const recognitionRef = useRef(null);
  const faceDetectorRef = useRef(null);
  const monitoringStartedRef = useRef(false);
  const phoneDetectorRef = useRef(null);

const monitoringStatsRef = useRef({
  frames: 0,
  eyeContactTotal: 0,
  postureTotal: 0,
  engagementTotal: 0,
  faceLostCount: 0,
  lookingAwayCount: 0,
  lookingDownCount: 0,
  phoneDetectedCount: 0
});

  useEffect(() => {
    return () => {
      stopCamera();
      stopSpeechRecognition();
      window.speechSynthesis.cancel();
    };
  }, []);

  async function startInterview() {
    setInterviewStarted(true);
    setLoading(true);
  
    try {
      await startCamera();
  
      await new Promise((resolve) => setTimeout(resolve, 1000));
  
      await setupFaceDetector();
      try {
        await setupPhoneDetector();
      } catch (error) {
        console.log("Phone detector could not load, continuing without phone detection:", error);
      }  
      const faceDetected = await checkFaceOnce();
  
      if (!faceDetected) {
        alert("Face not detected. Please show your full face clearly before starting.");
        setLoading(false);
        return;
      }
  
      resetMonitoringStats();
      startMonitoring();
  
      await generateQuestion();
    } catch (error) {
      console.error("Interview start error:", error);
      alert("Video checking failed. Please refresh and allow camera access.");
    } finally {
      setLoading(false);
    }
  }

  async function generateQuestion(previousAnswersOverride = sessionData) {  
    try {
      setLoading(false);
  
      const res = await fetch("https://ferment-frisbee-karate.ngrok-free.dev/api/interview/generate-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          resumeAnalysis,
          selectedRole,
          previousAnswers: previousAnswersOverride
          })
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        console.log("Question generation backend error:", data);
        alert(data.message || "Question generation failed");
        return;
      }
  
      setQuestionObj(data);
      setTranscript("");
  
      if (interviewMode === "speech") {
        setTimeout(() => {
          readQuestionAloud(data.question);
        }, 500);
      
        setTimeout(() => {
          startSpeechRecognition();
        }, 5000);
      }
      
      if (interviewMode === "typing") {
        setTypingStartTime(Date.now());
      }
    } catch (error) {
      console.error("Question generation frontend error:", error);
      alert("Could not generate question. Backend may not be reachable.");
    } finally {
      setLoading(false);
    }
  }

  function readQuestionAloud(question) {
    if (!question) return;
  
    window.speechSynthesis.cancel();
  
    const speakNow = () => {
      const speech = new SpeechSynthesisUtterance(question);
      speech.lang = "en-US";
      speech.rate = 0.85;
      speech.pitch = 1;
      speech.volume = 1;
  
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find((voice) =>
        voice.lang.toLowerCase().startsWith("en")
      );
  
      if (englishVoice) {
        speech.voice = englishVoice;
      }
  
      speech.onstart = () => {
        console.log("Reading question aloud...");
      };
  
      speech.onerror = (error) => {
        console.error("Speech synthesis error:", error);
      };
  
      window.speechSynthesis.speak(speech);
    };
  
    const voices = window.speechSynthesis.getVoices();
  
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = speakNow;
    } else {
      speakNow();
    }
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Camera error:", error);
      alert("Please allow camera access for interview monitoring.");
    }
  }

  function stopCamera() {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    }
  }

  async function setupFaceDetector() {
    const vision = await import("@mediapipe/tasks-vision");

    const filesetResolver = await vision.FilesetResolver.forVisionTasks(
"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"  );

    const faceDetector = await vision.FaceDetector.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite"
      },
      runningMode: "VIDEO"
    });

    faceDetectorRef.current = faceDetector;
  }

  async function checkFaceOnce() {
    const video = videoRef.current;
  
    if (!video || !faceDetectorRef.current) {
      return false;
    }
  
    for (let i = 0; i < 20; i++) {
      if (video.videoWidth && video.videoHeight) {
        const result = faceDetectorRef.current.detectForVideo(
          video,
          performance.now()
        );
  
        if (result.detections && result.detections.length > 0) {
          setVideoMetrics({
            faceVisible: true,
            eyeContactScore: 90,
            postureScore: 90,
            engagementScore: 90,
            phoneDetected: false,
            cheatingFlags: []
          });
  
          return true;
        }
      }
  
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  
    setVideoMetrics({
      faceVisible: false,
      eyeContactScore: 0,
      postureScore: 0,
      engagementScore: 0,
      phoneDetected: false,
      cheatingFlags: ["Face not detected before interview start"]
    });
  
    return false;
  }

  async function setupPhoneDetector() {
    const cocoSsd = await import("@tensorflow-models/coco-ssd");
    await import("@tensorflow/tfjs");
  
    const model = await cocoSsd.load();
    phoneDetectorRef.current = model;
  }

  function resetMonitoringStats() {
    monitoringStatsRef.current = {
      frames: 0,
      eyeContactTotal: 0,
      postureTotal: 0,
      engagementTotal: 0,
      faceLostCount: 0,
      lookingAwayCount: 0,
      lookingDownCount: 0,
      phoneDetectedCount: 0
    };
  }
  
  function getAverageVideoMetrics() {
    const stats = monitoringStatsRef.current;
    const frames = Math.max(1, stats.frames);
  
    const cheatingFlags = [];
  
    if (stats.faceLostCount > 5) cheatingFlags.push("Face was not visible multiple times");
    if (stats.lookingAwayCount > 8) cheatingFlags.push("Candidate looked away frequently");
    if (interviewMode === "speech" && stats.lookingDownCount > 8) {
      cheatingFlags.push("Candidate looked down while answering");
    }
    
    if (interviewMode === "typing" && stats.lookingDownCount > 25) {
      cheatingFlags.push("Candidate looked down too much even for typing mode");
    }    if (stats.phoneDetectedCount > 2) cheatingFlags.push("Mobile phone detected during interview");
  
    return {
      faceVisible: stats.faceLostCount < frames / 2,
      eyeContactScore: Math.round(stats.eyeContactTotal / frames),
      postureScore: Math.round(stats.postureTotal / frames),
      engagementScore: Math.round(stats.engagementTotal / frames),
      phoneDetected: stats.phoneDetectedCount > 2,
      cheatingFlags
    };
  }

  function startMonitoring() {
    if (monitoringStartedRef.current) return;
    monitoringStartedRef.current = true;
  
    const video = videoRef.current;
  
    async function monitorFrame() {
      if (!video || !faceDetectorRef.current) {
        requestAnimationFrame(monitorFrame);
        return;
      }
  
      if (!video.videoWidth || !video.videoHeight) {
        requestAnimationFrame(monitorFrame);
        return;
      }
  
      const result = faceDetectorRef.current.detectForVideo(
        video,
        performance.now()
      );
  
      let cheatingFlags = [];
      let eyeContactScore = 0;
      let postureScore = 0;
      let engagementScore = 0;
      let faceVisible = false;
      let phoneDetected = false;
  
      const stats = monitoringStatsRef.current;
      stats.frames += 1;
  
      if (!result.detections || result.detections.length === 0) {
        cheatingFlags.push("Face not visible");
        stats.faceLostCount += 1;
      } else {
        faceVisible = true;
  
        const face = result.detections[0];
        const box = face.boundingBox;
  
        const faceCenterX = box.originX + box.width / 2;
        const faceCenterY = box.originY + box.height / 2;
  
        const videoCenterX = video.videoWidth / 2;
        const videoCenterY = video.videoHeight / 2;
  
        const xDistance = Math.abs(faceCenterX - videoCenterX);
        const yDistance = Math.abs(faceCenterY - videoCenterY);
  
        eyeContactScore = 100;
        postureScore = 100;
  
        if (xDistance > 45) eyeContactScore -= 25;
        if (xDistance > 80) eyeContactScore -= 30;
        if (xDistance > 120) eyeContactScore -= 30;
  
        if (yDistance > 45) postureScore -= 25;
        if (yDistance > 80) postureScore -= 35;
  
        if (faceCenterY > videoCenterY + 70) {
          if (interviewMode === "speech") {
            cheatingFlags.push("Looking down while answering");
            stats.lookingDownCount += 1;
            eyeContactScore -= 25;
          }
        
          if (interviewMode === "typing") {
            stats.lookingDownCount += 0.25;
            eyeContactScore -= 5;
          }
        }
  
        if (interviewMode === "speech" && eyeContactScore < 65) {
          cheatingFlags.push("Looking away from camera");
          stats.lookingAwayCount += 1;
        }
        
        if (interviewMode === "typing" && eyeContactScore < 35) {
          cheatingFlags.push("Looking away too much during typing");
          stats.lookingAwayCount += 0.25;
        }
  
        eyeContactScore = Math.max(0, eyeContactScore);
        postureScore = Math.max(0, postureScore);
        engagementScore = Math.round((eyeContactScore + postureScore) / 2);
      }
  
      if (phoneDetectorRef.current && stats.frames % 15 === 0) {
        try {
          const predictions = await phoneDetectorRef.current.detect(video);
          phoneDetected = predictions.some(
            (item) => item.class === "cell phone" && item.score > 0.45
          );
  
          if (phoneDetected) {
            cheatingFlags.push("Mobile phone detected");
            stats.phoneDetectedCount += 1;
          }
        } catch (error) {
          console.log("Phone detection skipped:", error.message);
        }
      }
  
      stats.eyeContactTotal += eyeContactScore;
      stats.postureTotal += postureScore;
      stats.engagementTotal += engagementScore;
  
      setVideoMetrics({
        faceVisible,
        eyeContactScore,
        postureScore,
        engagementScore,
        phoneDetected,
        cheatingFlags
      });
  
      requestAnimationFrame(monitorFrame);
    }
  
    monitorFrame();
  }

  function startSpeechRecognition() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported. Please use Chrome.");
      return;
    }

    stopSpeechRecognition();

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event) => {
      let text = "";

      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript + " ";
      }

      setTranscript(text);
      calculateAudioMetrics(text);
    };

    recognition.onerror = (error) => {
      console.error("Speech error:", error);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
  }

  function stopSpeechRecognition() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setListening(false);
    }
  }

  function calculateAudioMetrics(text) {
    const words = text.trim().split(/\s+/).filter(Boolean);

    const fillers = ["um", "uh", "umm", "like", "actually", "basically"];
    const fillerCount = words.filter((word) =>
      fillers.includes(word.toLowerCase())
    ).length;

    let confidenceScore = 90;
    confidenceScore -= fillerCount * 5;

    if (words.length < 20) confidenceScore -= 15;
    if (words.length > 180) confidenceScore -= 5;

    confidenceScore = Math.max(30, Math.min(100, confidenceScore));

    setAudioMetrics({
      fillerCount,
      wordCount: words.length,
      confidenceScore
    });
  }

  function calculateTypingMetrics(text) {
    if (!typingStartTime) return;
  
    const now = Date.now();
    const timeTakenSeconds = Math.max(1, Math.round((now - typingStartTime) / 1000));
  
    const words = text.trim().split(/\s+/).filter(Boolean);
    const typingSpeedWPM = Math.round((words.length / timeTakenSeconds) * 60);
  
    setTypingMetrics((prev) => ({
      ...prev,
      timeTakenSeconds,
      typingSpeedWPM
    }));
  }

  async function submitAndNext() {
    if (!transcript.trim()) {
      alert("Please answer before moving to the next question.");
      return;
    }
  
    try {
      stopSpeechRecognition();
      setLoading(true);
  
      const res = await fetch(`${API_URL}/api/interview/evaluate-answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question: questionObj.question,
          answer: transcript,
          selectedRole,
          expectedDepth: questionObj.expectedDepth,
          note: "Transcript may contain speech recognition errors. Evaluate meaning, not exact wording."
        })
      });
  
      const evaluation = await res.json();
  
      if (!res.ok) {
        alert(evaluation.message || "Answer evaluation failed");
        return;
      }
      const averageVideoMetrics = getAverageVideoMetrics();
      const answerData = {
        question: questionObj.question,
        answer: transcript,
        difficulty: questionObj.difficulty,
        whyAsked: questionObj.whyAsked,
        evaluation,
  audioMetrics,
  typingMetrics,
  videoMetrics: averageVideoMetrics,
    interviewMode
      };
  
      const updatedSession = [...sessionData, answerData];

      setSessionData(updatedSession);
      resetMonitoringStats();
  
      if (updatedSession.length >= 3) {
        const feedbackRes = await fetch(`${API_URL}/api/interview/final-feedback`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            sessionData: updatedSession
          })
        });
  
        const feedback = await feedbackRes.json();
  
        if (!feedbackRes.ok) {
          alert(feedback.message || "Final feedback failed");
          return;
        }
  
        setFinalFeedback(feedback);
        setStep("feedback");
      } else {
        setTranscript("");
        await generateQuestion(updatedSession);
      }
    } catch (error) {
      console.error("Submit next error:", error);
      alert("Something went wrong while moving to next question.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h2>{selectedRole} Mock Interview</h2>
      {interviewStarted && (
  <button
    className="secondary-btn"
    onClick={() => {
      stopCamera();
      stopSpeechRecognition();
      window.speechSynthesis.cancel();
      setStep("mode");
    }}
  >
    Exit Interview
  </button>
)}

      {!interviewStarted && (
  <button className="secondary-btn" onClick={() => setStep("mode")}>
    ← Back to Mode Selection
  </button>
)}

      {!interviewStarted ? (
        <div className="start-panel">
          <h3>Ready to start?</h3>
          <p>
            Once you start, camera and speech monitoring will begin. The AI will
            read each question aloud and your answer will be transcribed.
          </p>
          <button onClick={startInterview}>Start Interview</button>
        </div>
      ) : (
        <>
          <div className="video-box">
            <video ref={videoRef} autoPlay playsInline muted className="webcam" />

            <div className="video-metrics">
              <p>Monitoring: Active</p>
              <p>Face visible: {videoMetrics.faceVisible ? "Yes" : "No"}</p>
              <p>Eye contact score: {videoMetrics.eyeContactScore}/100</p>
              <p>Posture score: {videoMetrics.postureScore}/100</p>
              <p>Engagement score: {videoMetrics.engagementScore}/100</p>

              {videoMetrics.cheatingFlags.length > 0 && (
                <div className="warning-box">
                  {videoMetrics.cheatingFlags.map((flag, index) => (
                    <p key={index}>⚠ {flag}</p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {questionObj && (
            <div className="question-box">
              <p className="difficulty">{questionObj.difficulty.toUpperCase()}</p>
              <h3>{questionObj.question}</h3>
              <p className="why">Why asked: {questionObj.whyAsked}</p>
            </div>
          )}

{interviewMode === "speech" && (
  <textarea
    value={transcript}
    readOnly
    placeholder="Your spoken answer will appear here automatically. Typing is disabled in speech mode."
  />
)}

{interviewMode === "typing" && (
  <textarea
    value={transcript}
    onChange={(e) => {
      const newText = e.target.value;
      setTranscript(newText);
      calculateAudioMetrics(newText);
      calculateTypingMetrics(newText);
    }}
    onKeyDown={(e) => {
      if (e.key === "Backspace") {
        setTypingMetrics((prev) => ({
          ...prev,
          backspaceCount: prev.backspaceCount + 1
        }));
      }
    }}
    placeholder="Type your answer here. Speech is disabled in typing mode."
  />
)}

<div className="metrics">
  <p>Mode: {interviewMode === "speech" ? "Speech" : "Typing"}</p>

  {interviewMode === "speech" && (
    <>
      <p>Speech: {listening ? "Listening" : "Paused"}</p>
      <p>Words: {audioMetrics.wordCount}</p>
      <p>Filler words: {audioMetrics.fillerCount}</p>
      <p>Confidence estimate: {audioMetrics.confidenceScore}/100</p>
    </>
  )}

  {interviewMode === "typing" && (
    <>
      <p>Words: {audioMetrics.wordCount}</p>
      <p>Time taken: {typingMetrics.timeTakenSeconds}s</p>
      <p>Typing speed: {typingMetrics.typingSpeedWPM} WPM</p>
      <p>Backspaces: {typingMetrics.backspaceCount}</p>
    </>
  )}
</div>

          <button onClick={submitAndNext} disabled={!questionObj || !transcript.trim()}>
  {loading
    ? "Processing..."
    : sessionData.length >= 2
    ? "Submit & Finish"
    : "Submit & Next Question"}
</button>
        </>
      )}
    </section>
  );
}

export default Interview;