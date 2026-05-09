function ModeSelection({ selectedRole, setInterviewMode, setStep }) {
    function chooseMode(mode) {
      setInterviewMode(mode);
      setStep("interview");
    }
  
    return (
      <section className="card">
        <button className="secondary-btn" onClick={() => setStep("roles")}>
          ← Back to Role Selection
        </button>
  
        <h2>Choose Interview Mode</h2>
        <p>
          Selected role: <b>{selectedRole}</b>
        </p>
  
        <div className="role-grid">
          <div className="role-card">
            <h3>Speech Interview</h3>
            <p>
              The AI reads the question aloud. You answer only by speaking.
              Typing is disabled. Eye contact and attention are strictly monitored.
            </p>
            <button onClick={() => chooseMode("speech")}>
              Start Speech Mode
            </button>
          </div>
  
          <div className="role-card">
            <h3>Typing Interview</h3>
            <p>
              The question is shown on screen. You answer only by typing.
              Typing time, typing speed, and pauses are tracked.
            </p>
            <button onClick={() => chooseMode("typing")}>
              Start Typing Mode
            </button>
          </div>
        </div>
      </section>
    );
  }
  
  export default ModeSelection;