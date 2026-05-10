import { useState } from "react";

function Login({ setUser }) {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    if (isSignup && !name) {
      alert("Please enter your name");
      return;
    }

    const userData = {
      name: name || email.split("@")[0],
      email
    };

    localStorage.setItem("mockInterviewUser", JSON.stringify(userData));
    setUser(userData);
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Intelligent Mock Interview Agent</h1>
        <p>Login to start your AI-powered mock interview.</p>

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">
            {isSignup ? "Create Account" : "Login"}
          </button>
        </form>

        <button
          className="secondary-btn"
          onClick={() => setIsSignup(!isSignup)}
        >
          {isSignup
            ? "Already have an account? Login"
            : "New user? Create account"}
        </button>
      </div>
    </div>
  );
}

export default Login;