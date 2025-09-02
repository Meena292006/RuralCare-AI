const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const User = require('../models/User');

if (!process.env.OPENAI_API_KEY) {
  console.error(' Missing OPENAI_API_KEY');
  process.exit(1);
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


const HEALTH_SYSTEM_PROMPT = `
You are RuralCare AI, a careful, evidence-based health assistant for general information only.
- You are NOT a doctor and do not give diagnoses, prescriptions, or treatment plans.
- Encourage seeing a qualified clinician for personal medical advice.
- If the user indicates an emergency (e.g., chest pain, severe bleeding, trouble breathing, thoughts of self-harm), tell them to seek emergency care immediately.
- Be clear about uncertainty and suggest reputable resources.
`;


const ALLOWED_LANGS = new Set([
  'en','hi','ta','te','ml','kn','gu','mr','pa','bn','ur','or','as','kok','ne','sd','mai','sa','bho','doi','mni'
]);


const CODE_TO_NAME = {
  en: 'English', hi: 'Hindi', ta: 'Tamil', te: 'Telugu', ml: 'Malayalam', kn: 'Kannada',
  gu: 'Gujarati', mr: 'Marathi', pa: 'Punjabi', bn: 'Bengali', ur: 'Urdu', or: 'Odia',
  as: 'Assamese', kok: 'Konkani', ne: 'Nepali', sd: 'Sindhi', mai: 'Maithili',
  sa: 'Sanskrit', bho: 'Bhojpuri', doi: 'Dogri', mni: 'Manipuri (Meitei)'
};

router.post('/', async (req, res) => {
  try {
    let { message, mode = 'health', uid, language } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, error: 'message (non-empty string) is required' });
    }
    message = message.trim();

    // Determine language to use:
    // 1) If frontend passes a valid language code, use it.
    // 2) Else if uid is provided, load user and use their saved language.
    // 3) Else default to 'en'.
    let langCode = 'en';
    if (typeof language === 'string' && ALLOWED_LANGS.has(language)) {
      langCode = language;
    } else if (uid) {
      const user = await User.findOne({ uid }).lean();
      if (user && ALLOWED_LANGS.has(user.language)) {
        langCode = user.language;
      }
    }
    const langName = CODE_TO_NAME[langCode] || 'English';

    const baseSystem = (mode === 'any')
      ? 'You are a helpful assistant.'
      : HEALTH_SYSTEM_PROMPT;

    const languageEnforcer = [
      `Always reply ONLY in ${langName} (${langCode}).`,
      `If the user writes in another language, politely answer in ${langName}.`,
      `Keep sentences simple and clear.`
    ].join(' ');

    const system = `${baseSystem}\n${languageEnforcer}`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: message }
      ],
      temperature: 0.7
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();
    if (!reply) return res.status(502).json({ success: false, error: 'No reply from model' });

    return res.json({ success: true, reply, language: langCode });
  } catch (err) {
    console.error(' /api/chat error:', err?.response?.data || err);
    return res.status(500).json({
      success: false,
      error: err?.response?.data || err?.message || 'OpenAI request failed'
    });
  }
});

module.exports = router;
