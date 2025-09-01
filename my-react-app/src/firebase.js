import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC3z-b1Um6wkJ041xHMwlGttqOVaBHdqq8",
  authDomain: "ruralcare-ai.firebaseapp.com",
  projectId: "ruralcare-ai",
  storageBucket: "ruralcare-ai.firebasestorage.app",
  messagingSenderId: "716758513435",
  appId: "1:716758513435:web:74aeb4a153343a363a05be",
  measurementId: "G-FRB0B8Q46H"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { auth };
export default app;
