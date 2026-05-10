import { useState } from "react";
import UploadResume from "./components/UploadResume";
import RoleSelection from "./components/RoleSelection";
import ModeSelection from "./components/ModeSelection";
import Interview from "./components/Interview";
import Feedback from "./components/Feedback";
import Login from "./components/Login";

function App() {
  const [step, setStep] = useState("upload");
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [interviewMode, setInterviewMode] = useState("");
  const [sessionData, setSessionData] = useState([]);
  const [finalFeedback, setFinalFeedback] = useState(null);

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("mockInterviewUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  function handleLogout() {
    localStorage.removeItem("mockInterviewUser");
    setUser(null);
    setStep("upload");
    setResumeAnalysis(null);
    setSelectedRole("");
    setInterviewMode("");
    setSessionData([]);
    setFinalFeedback(null);
  }

  if (!user) {
    return <Login setUser={setUser} />;
  }

  return (
    <div className="app">
      <div className="top-user">
        <span>Hi, {user.name}</span>
        <button className="secondary-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <header className="hero">
        <h1>Intelligent Mock Interview Agent</h1>
        <p>
          Resume-based role prediction, adaptive AI interviews, and multimodal
          feedback.
        </p>
      </header>

      {step === "upload" && (
        <UploadResume
          setResumeAnalysis={setResumeAnalysis}
          setStep={setStep}
        />
      )}

      {step === "roles" && (
        <RoleSelection
          resumeAnalysis={resumeAnalysis}
          setSelectedRole={setSelectedRole}
          setStep={setStep}
        />
      )}

      {step === "mode" && (
        <ModeSelection
          selectedRole={selectedRole}
          setInterviewMode={setInterviewMode}
          setStep={setStep}
        />
      )}

      {step === "interview" && (
        <Interview
          resumeAnalysis={resumeAnalysis}
          selectedRole={selectedRole}
          interviewMode={interviewMode}
          sessionData={sessionData}
          setSessionData={setSessionData}
          setFinalFeedback={setFinalFeedback}
          setStep={setStep}
        />
      )}

      {step === "feedback" && (
        <Feedback finalFeedback={finalFeedback} sessionData={sessionData} />
      )}
    </div>
  );
}

export default App;