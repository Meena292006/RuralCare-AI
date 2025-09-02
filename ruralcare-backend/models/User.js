const mongoose = require('mongoose');

const ALLOWED_LANGS = [
  'en', 'hi', 'ta', 'te', 'ml', 'kn', 'gu', 'mr', 'pa', 'bn', 'ur', 'or', 'as', 'kok', 'ne', 'sd', 'mai', 'sa', 'bho', 'doi', 'mni'
];

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  firstTime: { type: Boolean, default: true },
  language: { type: String, default: 'en', enum: ALLOWED_LANGS },
  history: { type: Array, default: [] },
  location: {
    lat: { type: Number },
    lon: { type: Number }
  }
});

module.exports = mongoose.model('User', userSchema);