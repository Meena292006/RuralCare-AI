import os
import io
import base64
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from dotenv import load_dotenv

load_dotenv()

OPENAI_KEY = os.getenv("OPENAI_API_KEY")
ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "*")
PORT = int(os.getenv("PORT", 5001))

if not OPENAI_KEY:
    raise RuntimeError("Please set OPENAI_API_KEY in your environment")

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ALLOWED_ORIGIN}})
# optional: limit upload size (bytes), e.g. 10MB
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024

# Helper mapping (short)
LANG_MAP = {
    "en":"English", "hi":"Hindi", "ta":"Tamil", "te":"Telugu", "ml":"Malayalam",
    "kn":"Kannada","gu":"Gujarati","mr":"Marathi","pa":"Punjabi","bn":"Bengali",
    "ur":"Urdu","or":"Odia","as":"Assamese","kok":"Konkani","ne":"Nepali",
    "sd":"Sindhi","mai":"Maithili","sa":"Sanskrit","bho":"Bhojpuri","doi":"Dogri","mni":"Manipuri"
}

HEADERS = {"Authorization": f"Bearer {OPENAI_KEY}"}

@app.route("/api/voice", methods=["POST"])
def voice():
    try:
        # Expect multipart form: file under "audio", optional "language"
        if "audio" not in request.files:
            return jsonify({"success": False, "error": "No audio file provided"}), 400

        audio_file = request.files["audio"]
        language_code = request.form.get("language", "en")
        lang_name = LANG_MAP.get(language_code, "English")

        # 1) Transcribe audio via OpenAI Whisper endpoint
        # We call the REST endpoint directly (multipart form).
        files = {
            "file": (audio_file.filename or "voice.webm", audio_file.read(), audio_file.mimetype or "audio/webm")
        }
        data = {"model": "whisper-1"}
        transr = requests.post("https://api.openai.com/v1/audio/transcriptions",
                               headers=HEADERS, files=files, data=data, timeout=60)
        if transr.status_code != 200:
            return jsonify({"success": False, "error": "Transcription failed", "detail": transr.text}), 500

        transcription = transr.json()
        transcript_text = transcription.get("text", "").strip()

        # 2) Chat completion (force language)
        system_prompt = (
            "You are RuralCare AI, a careful evidence-based health assistant. "
            "You are NOT a doctor. Encourage seeing a qualified clinician for personal medical advice.\n"
            f"Always reply ONLY in {lang_name} ({language_code}). Keep sentences simple and clear."
        )

        chat_payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": transcript_text}
            ],
            "temperature": 0.7
        }
        chatr = requests.post("https://api.openai.com/v1/chat/completions",
                              headers={**HEADERS, "Content-Type": "application/json"},
                              json=chat_payload, timeout=60)
        if chatr.status_code != 200:
            return jsonify({"success": False, "error": "Chat completion failed", "detail": chatr.text}), 500

        chat_json = chatr.json()
        reply_text = chat_json.get("choices", [{}])[0].get("message", {}).get("content", "").strip()

        # 3) Text-to-speech (TTS)
        # Call OpenAI TTS endpoint (returns binary audio). We'll POST JSON and get binary.
        tts_payload = {
            "model": "gpt-4o-mini-tts",
            "voice": "alloy",
            "input": reply_text,
            "language": language_code
        }
        tts_r = requests.post("https://api.openai.com/v1/audio/speech",
                              headers={**HEADERS, "Content-Type": "application/json"},
                              json=tts_payload, timeout=60)

        if tts_r.status_code not in (200, 201):
            return jsonify({"success": False, "error": "TTS generation failed", "detail": tts_r.text}), 500

        audio_bytes = tts_r.content
        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")

        return jsonify({
            "success": True,
            "transcript": transcript_text,
            "reply": reply_text,
            "audio_b64": audio_b64,
            "language": language_code
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    print(f"Starting Python voice service on port {PORT}")
    app.run(host="0.0.0.0", port=PORT, debug=True)
