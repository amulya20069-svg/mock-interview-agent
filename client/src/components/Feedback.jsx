function Feedback({ finalFeedback, sessionData }) {
    return (
      <section className="card">
        <h2>Final Interview Feedback</h2>
  
        <div className="final-score">
          {finalFeedback.overallScore}/100
        </div>
  
        <h3>Technical Feedback</h3>
        <p>{finalFeedback.technicalFeedback}</p>
  
        <h3>Communication Feedback</h3>
        <p>{finalFeedback.communicationFeedback}</p>
  
        <h3>Confidence Feedback</h3>
        <p>{finalFeedback.confidenceFeedback}</p>
  
        <h3>Webcam / Eye Contact Feedback</h3>
        <p>{finalFeedback.webcamFeedback}</p>
  
        <h3>Attention Flags</h3>
        {finalFeedback.cheatingOrAttentionFlags?.length > 0 ? (
          <ul>
            {finalFeedback.cheatingOrAttentionFlags.map((flag, index) => (
              <li key={index}>{flag}</li>
            ))}
          </ul>
        ) : (
          <p>No major attention flags detected.</p>
        )}
  
        <h3>Role Readiness</h3>
        <p>{finalFeedback.roleReadiness}</p>
  
        <h3>Top Improvements</h3>
        <ul>
          {finalFeedback.topImprovements.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
  
        <h3>Practice Plan</h3>
        <ul>
          {finalFeedback.practicePlan.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
  
        <h3>Question-wise Scores</h3>
        {sessionData.map((item, index) => (
          <div className="answer-card" key={index}>
            <h4>Q{index + 1}: {item.question}</h4>
  
            <p><b>Technical:</b> {item.evaluation.technicalScore}/100</p>
            <p><b>Depth:</b> {item.evaluation.depthScore}/100</p>
            <p><b>Clarity:</b> {item.evaluation.clarityScore}/100</p>
            <p><b>Semantic Match:</b> {item.evaluation.semanticMatchScore}/100</p>
  
            <p><b>Audio Confidence:</b> {item.audioMetrics.confidenceScore}/100</p>
            <p><b>Filler Words:</b> {item.audioMetrics.fillerCount}</p>
  
            <p><b>Eye Contact:</b> {item.videoMetrics.eyeContactScore}/100</p>
            <p><b>Posture:</b> {item.videoMetrics.postureScore}/100</p>
            <p><b>Engagement:</b> {item.videoMetrics.engagementScore}/100</p>
  
            {item.videoMetrics.cheatingFlags?.length > 0 && (
              <>
                <p><b>Attention Flags:</b></p>
                <ul>
                  {item.videoMetrics.cheatingFlags.map((flag, i) => (
                    <li key={i}>{flag}</li>
                  ))}
                </ul>
              </>
            )}
  
            <p><b>Improved Answer:</b> {item.evaluation.improvedAnswer}</p>
          </div>
        ))}
      </section>
    );
  }
  
  export default Feedback;