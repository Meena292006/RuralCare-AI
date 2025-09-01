import React, { useState } from 'react';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const LanguageSelection = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const [language, setLanguage] = useState("en");

  const handleSave = async () => {
    const uid = auth.currentUser.uid;
    await fetch(`http://localhost:5000/api/users/${uid}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, firstTime: false })
    });
    navigate("/chat");
  };

  return (
    <>
      <div className="language-container">
        <h2>Choose Your Language</h2>
        <select value={language} onChange={e => setLanguage(e.target.value)}>
          <option value="en">English</option>
          <option value="hi">हिन्दी (Hindi)</option>
          <option value="ta">தமிழ் (Tamil)</option>
          <option value="te">తెలుగు (Telugu)</option>
          <option value="ml">മലയാളം (Malayalam)</option>
          <option value="kn">ಕನ್ನಡ (Kannada)</option>
          <option value="gu">ગુજરાતી (Gujarati)</option>
          <option value="mr">मराठी (Marathi)</option>
          <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
          <option value="bn">বাংলা (Bengali)</option>
          <option value="ur">اُردُو (Urdu)</option>
          <option value="or">ଓଡ଼ିଆ (Odia)</option>
          <option value="as">অসমীয়া (Assamese)</option>
          <option value="kok">कोंकणी (Konkani)</option>
          <option value="ne">नेपाली (Nepali)</option>
          <option value="sd">سنڌي / सिन्धी (Sindhi)</option>
          <option value="mai">मैथिली (Maithili)</option>
          <option value="sa">संस्कृतम् (Sanskrit)</option>
          <option value="bho">भोजपुरी (Bhojpuri)</option>
          <option value="doi">डोगरी (Dogri)</option>
          <option value="mni">মৈতৈলোন্ (Manipuri/Meitei)</option>
        </select>
        <button onClick={handleSave}>Continue</button>
      </div>

      {/* Only the tag changed; CSS content identical */}
      <style>{`
        .language-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background: radial-gradient(circle at top left, #0d0d0d, #121212, #1a1a1a);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #e0e0e0;
          padding: 20px;
          box-sizing: border-box;
          text-align: center;
        }
        .language-container h2 {
          font-size: 2rem;
          margin-bottom: 1.5rem;
          color: #00f0ff;
          letter-spacing: 1px;
        }
        .language-container select {
          width: 300px;
          padding: 0.6rem 1rem;
          font-size: 1rem;
          border-radius: 0.5rem;
          border: 1px solid #00f0ff;
          background: rgba(20, 20, 20, 0.9);
          color: #e0e0e0;
          outline: none;
          margin-bottom: 2rem;
          transition: border-color 0.3s ease;
          cursor: pointer;
        }
        .language-container select:hover,
        .language-container select:focus {
          border-color: #00ffff;
        }
        .language-container button {
          background: #00f0ff;
          border: none;
          color: #121212;
          padding: 0.75rem 2rem;
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: 0.6rem;
          cursor: pointer;
          box-shadow: 0 0 15px #00f0ffaa;
          transition: background-color 0.3s ease, transform 0.2s ease;
        }
        .language-container button:hover {
          background: #00cccc;
          transform: scale(1.05);
        }
      `}</style>
    </>
  );
};

export default LanguageSelection;

