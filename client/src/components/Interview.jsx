import { useEffect, useRef, useState } from "react";

function Interview({
  resumeAnalysis,
  selectedRole,
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

  useEffect(() => {
    return () => {
      stopCamera();
      stopSpeechRecognition();
      window.speechSynthesis.cancel();
    };
  }, []);

  async function startInterview() {
    setInterviewStarted(true);
    await startCamera();
    await setupFaceDetector();
    startMonitoring();
    await generateQuestion();
  }

  async function generateQuestion(previousAnswersOverride = sessionData) {  
    try {
      setLoading(true);
  
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
  
      setTimeout(() => {
        readQuestionAloud(data.question);
      }, 500);
      
      setTimeout(() => {
        startSpeechRecognition();
      }, 5000);
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
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    const faceDetector = await vision.FaceDetector.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite"
      },
      runningMode: "VIDEO"
    });

    faceDetectorRef.current = faceDetector;
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

      if (!result.detections || result.detections.length === 0) {
        cheatingFlags.push("Face not visible");
        setVideoMetrics({
          faceVisible: false,
          eyeContactScore: 0,
          postureScore: 0,
          engagementScore: 0,
          cheatingFlags
        });
      } else {
        const face = result.detections[0];
        const box = face.boundingBox;

        const faceCenterX = box.originX + box.width / 2;
        const faceCenterY = box.originY + box.height / 2;

        const videoCenterX = video.videoWidth / 2;
        const videoCenterY = video.videoHeight / 2;

        const xDistance = Math.abs(faceCenterX - videoCenterX);
        const yDistance = Math.abs(faceCenterY - videoCenterY);

        let eyeContactScore = 100;
        let postureScore = 100;

        if (xDistance > 80) eyeContactScore -= 25;
        if (xDistance > 150) eyeContactScore -= 35;
        if (yDistance > 90) postureScore -= 30;

        eyeContactScore = Math.max(0, eyeContactScore);
        postureScore = Math.max(0, postureScore);

        if (eyeContactScore < 60) {
          cheatingFlags.push("Looking away from screen/camera");
        }

        if (postureScore < 60) {
          cheatingFlags.push("Posture not centered");
        }

        const engagementScore = Math.round(
          (eyeContactScore + postureScore) / 2
        );

        setVideoMetrics({
          faceVisible: true,
          eyeContactScore,
          postureScore,
          engagementScore,
          cheatingFlags
        });
      }

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

  async function submitAndNext() {
    if (!transcript.trim()) {
      alert("Please answer before moving to the next question.");
      return;
    }

    stopSpeechRecognition();
    setLoading(true);

    const res = await fetch("http://localhost:5001/api/interview/evaluate-answer", {
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

    const answerData = {
      question: questionObj.question,
      answer: transcript,
      difficulty: questionObj.difficulty,
      whyAsked: questionObj.whyAsked,
      evaluation,
      audioMetrics,
      videoMetrics
    };

    const updatedSession = [...sessionData, answerData];
    setSessionData(updatedSession);

    if (updatedSession.length >= 3) {
      const feedbackRes = await fetch("https://ferment-frisbee-karate.ngrok-free.dev/api/interview/final-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sessionData: updatedSession
        })
      });

      const feedback = await feedbackRes.json();
      setFinalFeedback(feedback);
      setStep("feedback");
    } else {
      setTranscript("");
      setLoading(false);
      await generateQuestion(updatedSession);
      }
  }

  return (
    <section className="card">
      <h2>{selectedRole} Mock Interview</h2>

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

          <textarea
            value={transcript}
            onChange={(e) => {
              setTranscript(e.target.value);
              calculateAudioMetrics(e.target.value);
            }}
            placeholder="Your answer will appear here automatically as you speak."
          />

          <div className="metrics">
            <p>Speech: {listening ? "Listening" : "Paused"}</p>
            <p>Words: {audioMetrics.wordCount}</p>
            <p>Filler words: {audioMetrics.fillerCount}</p>
            <p>Confidence estimate: {audioMetrics.confidenceScore}/100</p>
          </div>

          <button onClick={submitAndNext} disabled={loading}>
            {sessionData.length >= 2 ? "Submit & Finish" : "Submit & Next Question"}
          </button>
        </>
      )}
    </section>
  );
}

export default Interview;