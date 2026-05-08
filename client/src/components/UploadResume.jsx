import { useState } from "react";

function UploadResume({ setResumeAnalysis, setStep }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    if (!file) {
      alert("Please upload a resume PDF");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("resume", file);

      const res = await fetch("http://localhost:5001/api/interview/analyze-resume", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Resume analysis failed");
        console.log("Backend error:", data);
        return;
      }

      setResumeAnalysis(data.analysis);
      setStep("roles");
    } catch (error) {
      console.error("Frontend upload error:", error);
      alert("Something went wrong while uploading resume.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h2>Step 1: Upload Resume</h2>
      <p>
        The AI will read your resume and infer suitable roles using projects,
        skills, and experience.
      </p>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Analyzing..." : "Analyze Resume"}
      </button>
    </section>
  );
}

export default UploadResume;