// Chat.jsx (modified to include voice)
import React, { useState, useEffect, useRef } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import PatientTracking from './patienttracking';

const ALLOWED_LANGS = [{ code: 'en', name: 'English' },
                       { code: 'hi', name: 'हिन्दी' }, 
                       { code: 'ta', name: 'தமிழ்' },
                        { code: 'te', name: 'తెలుగు' }, 
                        { code: 'ml', name: 'മലയാളം' },
                         { code: 'kn', name: 'ಕನ್ನಡ' },
                          { code: 'gu', name: 'ગુજરાતી' },
                           { code: 'mr', name: 'मराठी' }, 
                           { code: 'pa', name: 'ਪੰਜਾਬੀ' }, { code: 'bn', name: 'বাংলা' }, 
                           { code: 'ur', name: 'اردو' }, { code: 'or', name: 'ଓଡ଼ିଆ' }, { code: 'as', name: 'অসমীয়া' }, 
                           { code: 'kok', name: 'कोंकणी' }, { code: 'ne', name: 'नेपाली' }, { code: 'sd', name: 'سنڌي' }, 
                           { code: 'mai', name: 'मैथिली' }, { code: 'sa', name: 'संस्कृतम्' }, { code: 'bho', name: 'भोजपुरी' }, 
                           { code: 'doi', name: 'डोगरी' }, { code: 'mni', name: 'মেইতেই লোন্' } ];

const Chat = () => {
  const auth = getAuth();
  const navigate = useNavigate();
  const [uid, setUid] = useState(null);
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Welcome to RuralCare AI! How can I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('en');
  const messagesEndRef = useRef(null);

  // --- Voice recording refs & state
  const mediaRecorderRef = useRef(null);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/');
      } else {
        setUid(user.uid);
      }
    });
    return () => unsub();
  }, [auth, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!uid) {
      setMessages(prev => [...prev, { from: 'bot', text: 'Error: No user session. Please log in again.' }]);
      return;
    }

    setMessages(prev => [...prev, { from: 'user', text: input }]);
    const userInput = input;
    setInput('');

    try {
      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userInput, mode: 'health', uid, language })
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Chat API error');
      }

      if (data.reply && data.reply.toLowerCase().includes('map')) {
        setMessages(prev => [...prev, { from: 'bot', type: 'map' }]);
      } else {
        setMessages(prev => [...prev, { from: 'bot', text: data.reply || 'No response' }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { from: 'bot', text: 'Error: Could not get a response.' }]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ---------- VOICE HANDLERS ----------
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      const chunks = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mr.onstop = async () => {
        // Prepare blob and send to Python voice endpoint
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', blob, 'voice.webm');
        formData.append('language', language);

        // Optimistically show 'recording...' or placeholder
        setMessages(prev => [...prev, { from: 'user', text: '(voice) — processing...' }]);

        try {
          const res = await fetch('http://localhost:5001/api/voice', {
            method: 'POST',
            body: formData
          });

          const data = await res.json();
          if (!res.ok || !data?.success) {
            throw new Error(data?.error || 'Voice API error');
          }

          // Replace last placeholder with user's transcribed text
          setMessages(prev => {
            const copy = [...prev];
            // find last user placeholder index (from the end)
            for (let i = copy.length - 1; i >= 0; i--) {
              if (copy[i].from === 'user' && copy[i].text && copy[i].text.startsWith('(voice)')) {
                copy[i] = { from: 'user', text: data.transcript || '(voice)' };
                break;
              }
            }
            return copy;
          });

          // If reply mentions map, render map, else show text
          if (data.reply && data.reply.toLowerCase().includes('map')) {
            setMessages(prev => [...prev, { from: 'bot', type: 'map' }]);
          } else {
            setMessages(prev => [...prev, { from: 'bot', text: data.reply }]);
          }

          // Play audio (base64)
          if (data.audio_b64) {
            const audioSrc = "data:audio/mpeg;base64," + data.audio_b64;
            const audio = new Audio(audioSrc);
            audio.play().catch(err => console.warn("audio play failed:", err));
          }

        } catch (err) {
          console.error("Voice request failed:", err);
          setMessages(prev => [...prev, { from: 'bot', text: 'Voice processing failed.' }]);
        }
      };

      mr.start();
      setRecording(true);
    } catch (err) {
      console.error("Could not start recording:", err);
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') {
      mr.stop();
      // stop tracks to release mic
      mr.stream?.getTracks()?.forEach(t => t.stop && t.stop());
    }
    setRecording(false);
  };

  const toggleRecording = () => {
    if (recording) stopRecording();
    else startRecording();
  };

  // ---------- JSX ----------
  return (
    <>
      <div className="chat-container">
        <header className="chat-header">
          <h1>RuralCare AI Chat</h1>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{ marginLeft: '1rem', padding: '0.3rem', borderRadius: '0.5rem' }}
          >
            {ALLOWED_LANGS.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </header>

        <main className="chat-messages">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`message ${msg.from === 'user' ? 'user' : 'bot'}`}
            >
              {msg.type === 'map' ? (
                <div className="map-container">
                  <PatientTracking />
                </div>
              ) : (
                msg.text
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </main>

        <footer className="chat-input-area">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
          />
          <button onClick={handleSend}>Send</button>

          {/* VOICE BUTTON */}
          <button
            onClick={toggleRecording}
            title={recording ? "Stop recording" : "Start voice input"}
            style={{
              marginLeft: '0.5rem',
              background: recording ? '#ff4d4d' : '#80cddaff',
              color: '#fff',
              padding: '0.6rem',
              borderRadius: '999px',
              border: 'none',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            {recording ? 'Stop' : '🎤'}
          </button>
        </footer>
      </div>

      <style>{`
        /* (your CSS kept the same) */
        .chat-container { display: flex; flex-direction: column; height: 100vh; background: radial-gradient(circle at top left, #0d0d0d, #121212, #1a1a1a); color: #e0e0e0; }
        .chat-header { padding: 1rem 2rem; background-color: #00f0ff; color: #121212; font-weight: 700; font-size: 1.5rem; text-align: center; box-shadow: 0 2px 6px #00f0ff88; }
        .chat-messages { flex: 1; padding: 1rem 2rem; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75rem; }
        .message { max-width: 70%; padding: 0.75rem 1rem; border-radius: 1rem; font-size: 1rem; line-height: 1.3; }
        .message.user { align-self: flex-end; background-color: #00f0ffbb; color: #121212; border-bottom-right-radius: 0; }
        .message.bot { align-self: flex-start; background-color: #1a1a1a; border: 1px solid #00f0ff; color: #00f0ff; border-bottom-left-radius: 0; }
        .chat-input-area { display: flex; gap: 0.75rem; padding: 1rem 2rem; border-top: 1px solid #00f0ff33; background-color: #121212; }
        textarea { flex: 1; resize: none; padding: 0.75rem 1rem; border-radius: 1rem; border: 1px solid #00f0ff; background: #0d0d0d; color: #e0e0e0; font-size: 1rem; outline: none; height: 3rem; transition: border-color 0.3s ease; }
        textarea:focus { border-color: #00ffff; }
        button { background-color: #00f0ff; color: #121212; border: none; padding: 0 1.5rem; border-radius: 1rem; font-weight: 700; cursor: pointer; transition: background-color 0.3s ease, transform 0.2s ease; font-size: 1rem; }
        button:hover { filter: brightness(0.95); transform: translateY(-1px); }
        .message .map-container { width: 100%; height: 300px; margin-top: 10px; border-radius: 0.75rem; overflow: hidden; border: 1px solid #00f0ff55; }
      `}</style>
    </>
  );
};

export default Chat;
