import { useState } from "react";
import UploadResume from "./components/UploadResume";
import RoleSelection from "./components/RoleSelection";
import Interview from "./components/Interview";
import Feedback from "./components/Feedback";

function App() {
  const [step, setStep] = useState("upload");
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [sessionData, setSessionData] = useState([]);
  const [finalFeedback, setFinalFeedback] = useState(null);

  return (
    <div className="app">
      <header className="hero">
        <h1>Intelligent Mock Interview Agent</h1>
        <p>Resume-based role prediction, adaptive AI interviews, and multimodal feedback.</p>
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

      {step === "interview" && (
        <Interview
          resumeAnalysis={resumeAnalysis}
          selectedRole={selectedRole}
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