import React from 'react';
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';   // <- import auth here
import './Login.css';

const Login = () => {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const uid = result.user.uid;
      const email = result.user.email;

      const res = await fetch(`http://localhost:5000/api/users/${uid}`);

      if (res.status === 404) {
        // User doesn't exist → create new user
        await fetch("http://localhost:5000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid,
            email,
            firstTime: true,
            language: "",
            history: []
          }),
        });

        navigate("/language-selection");
      } else {
        // User exists → check if it's their first time
        const user = await res.json();
        if (user.firstTime) {
          navigate("/language-selection");
        } else {
          navigate("/chat");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Google login failed. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Welcome to RuralCare AI</h1>
        <p className="login-subtitle">Your AI-powered rural healthcare assistant.</p>

        <button className="google-btn" onClick={handleGoogleLogin}>
          Continue with Google
        </button>

        <small className="disclaimer">
          By logging in, you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.
        </small>
      </div>
    </div>
  );
};

export default Login;

