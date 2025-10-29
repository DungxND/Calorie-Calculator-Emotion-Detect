

const API_KEY = "AIzaSyAI5i11g4Xs-HpnuHQfn69NOjpR2jXcMnE";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const body = {
  contents: [{ parts: [{ text: "Hello Gemini!" }] }],
};

fetch(API_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-goog-api-key": API_KEY,
  },
  body: JSON.stringify(body),
})
  .then(res => res.json())
  .then(console.log)
  .catch(console.error);
