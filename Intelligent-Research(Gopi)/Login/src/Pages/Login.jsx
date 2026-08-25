import { useState } from "react";

function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error,setError] = useState("");

  const handleLogin = (event) => {
  event.preventDefault();

  //to handle error if user submiting without values
   setError("");

  if (!email) {
    setError("Please enter your email 😡      ");
    return;
  }

  if (!password) {
    setError("Please enter your password 😱    ");
    return;
  }

  console.log("Email:", email);
  console.log("Password:", password);
};

  return (
    <div className="login-page">

      <div className="login-container">

        {/* Left Section */}
        <div className="login-intro">

          <h1>
            Research Funding
            <br />
            & Innovation
          </h1>

          <p>
            Intelligent insights for research,
            funding and innovation.
          </p>

        </div>


        {/* Right Section */}
        <div className="login-card">

          <h2>Welcome back</h2>

          <p className="login-subtitle">
            Sign in to continue to your account
          </p>


{/* To display the error*/}
        {error && (
  <div className="error-message">
    {error}
  </div>
)}
        <form onSubmit={handleLogin}>
          {/* Email */}
          <div className="form-group">

            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

          </div>


          {/* Password */}
          <div className="form-group">

            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

          </div>


          <button type="submit"
          className="login-button">
            Sign In
          </button>

          </form>


          <div className="divider">
            <span>or</span>
          </div>


          <button className="google-button">
            Continue with Google
          </button>


          <p className="register-text">
            Don't have an account?
            <span className="register-link">
              Register
            </span>
          </p>

        </div>

      </div>

    </div>
  );
}

export default Login;