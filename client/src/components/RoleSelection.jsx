function RoleSelection({ resumeAnalysis, setSelectedRole, setStep }) {
    if (!resumeAnalysis) {
      return (
        <section className="card">
          <h2>No resume analysis found</h2>
          <p>Please go back and upload your resume again.</p>
          <button onClick={() => setStep("upload")}>Back to Upload</button>
        </section>
      );
    }
  
    const roles = resumeAnalysis.recommendedRoles || [];
  
    function chooseRole(role) {
      setSelectedRole(role);
      setStep("interview");
    }
  
    return (
      <section className="card">
        <h2>Step 2: Recommended Roles</h2>
  
        <div className="summary">
          <h3>Candidate Summary</h3>
          <p>{resumeAnalysis.candidateSummary || "No summary available."}</p>
        </div>
  
        {roles.length === 0 ? (
          <p>No roles were generated. Try uploading the resume again.</p>
        ) : (
          <div className="role-grid">
            {roles.map((item, index) => (
              <div className="role-card" key={index}>
                <h3>{item.role}</h3>
                <p className="score">{item.matchScore}% Match</p>
                <p>{item.reason}</p>
  
                <h4>Focus Areas</h4>
                <ul>
                  {(item.focusAreas || []).map((area, i) => (
                    <li key={i}>{area}</li>
                  ))}
                </ul>
  
                <h4>Weak Areas To Probe</h4>
                <ul>
                  {(item.weakAreasToProbe || []).map((area, i) => (
                    <li key={i}>{area}</li>
                  ))}
                </ul>
  
                <button onClick={() => chooseRole(item.role)}>
                  Start {item.role} Interview
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }
  
  export default RoleSelection;