import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import LanguageSelection from './pages/LanguageSelection';
import Chat from './pages/Chat';
import PatientTracking from './pages/patienttracking'; // Import the new component
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/language-selection" element={<LanguageSelection />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/patient-tracking" element={<PatientTracking />} /> {/* New route */}
      </Routes>
    </Router>
  );
}

export default App;

