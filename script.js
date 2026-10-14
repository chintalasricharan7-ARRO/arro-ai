
const languageSelect = document.getElementById("language");
const chat = document.getElementById("chat");
const form = document.getElementById("chatForm");
const input = document.getElementById("message");
const micButton = document.getElementById("micButton");
const stopButton = document.getElementById("stopButton");
const statusText = document.getElementById("status");

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;
let listening = false;

const greetings = {
  "en-IN": "Hello! I am ARRO. How can I help you today?",
  "te-IN": "నమస్కారం! నేను ARRO. మీకు ఎలా సహాయం చేయగలను?",
  "hi-IN": "नमस्ते! मैं ARRO हूँ। मैं आपकी क्या मदद कर सकता हूँ?"
};

function addMessage(text, type) {
  const message = document.createElement("div");
  message.className = "message " + type;
  message.textContent = text;
  chat.appendChild(message);
  chat.scrollTop = chat.scrollHeight;
}

function speak(text) {
  if (!("speechSynthesis" in window)) {
    statusText.textContent = "Speech output is not supported.";
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const lang = languageSelect.value;

  utterance.lang = lang;
  utterance.rate = 0.95;
  utterance.pitch = 1;

  const voices = window.speechSynthesis.getVoices();
  const matchingVoice = voices.find(voice =>
    voice.lang.toLowerCase() === lang.toLowerCase()
  );

  if (matchingVoice) {
    utterance.voice = matchingVoice;
  }

  utterance.onstart = () => {
    statusText.textContent = "ARRO is speaking...";
  };

  utterance.onend = () => {
    statusText.textContent = "Ready to talk.";
  };

  utterance.onerror = () => {
    statusText.textContent =
      "Voice unavailable. Please read the reply on screen.";
  };

  window.speechSynthesis.speak(utterance);
}

function getReply(message, lang) {
  const text = message.toLowerCase();

  if (lang === "te-IN") {
    if (/నమస్కార|హలో|హాయ్/.test(text)) {
      return "నమస్కారం! నేను ARRO. మీకు ఎలా సహాయం చేయగలను?";
    }
    if (/పేరు/.test(text)) {
      return "నా పేరు ARRO. నేను మీ వాయిస్ అసిస్టెంట్‌ని.";
    }
    if (/ధన్యవాద/.test(text)) {
      return "మీకు స్వాగతం! ఇంకా ఏదైనా సహాయం కావాలా?";
    }
    if (/సమయ|టైమ్/.test(text)) {
      return "మీకు సమయం తెలుసుకోవాలంటే మీ పరికరంలోని గడియారాన్ని చూడండి.";
    }
    return "మీ ప్రశ్న అర్థమైంది. దయచేసి మరిన్ని వివరాలు చెప్పగలరా?";
  }

  if (lang === "hi-IN") {
    if (/नमस्ते|हेलो|हाय/.test(text)) {
      return "नमस्ते! मैं ARRO हूँ। मैं आपकी क्या मदद कर सकता हूँ?";
    }
    if (/नाम/.test(text)) {
      return "मेरा नाम ARRO है। मैं आपका वॉइस असिस्टेंट हूँ।";
    }
    if (/धन्यवाद|शुक्रिया/.test(text)) {
      return "आपका स्वागत है! क्या मैं और कुछ मदद कर सकता हूँ?";
    }
    if (/समय|टाइम/.test(text)) {
      return "समय जानने के लिए कृपया अपने डिवाइस की घड़ी देखें।";
    }
    return "मैं आपकी बात समझने की कोशिश कर रहा हूँ। कृपया थोड़ा और बताइए।";
  }

  if (/\b(hello|hi|hey|namaste)\b/.test(text)) {
    return "Hello! I am ARRO. How can I help you today?";
  }
  if (text.includes("your name") || text.includes("who are you")) {
    return "I am ARRO, your multilingual voice assistant.";
  }
  if (text.includes("thank")) {
    return "You're welcome! Is there anything else I can help you with?";
  }
  if (text.includes("hotel")) {
    return "I can help answer hotel enquiries. Please provide the hotel's details and FAQs to configure me for that business.";
  }
  if (text.includes("price") || text.includes("cost")) {
    return "Please tell me which product or service you are asking about.";
  }
  if (text.includes("bye")) {
    return "Goodbye! Thank you for talking with ARRO.";
  }

  return "I heard you say: " + message +
    ". I am currently a basic prototype. Connect an AI engine to answer more questions naturally.";
}

function sendMessage(message) {
  const cleanMessage = message.trim();
  if (!cleanMessage) return;

  addMessage(cleanMessage, "user");
  input.value = "";

  const reply = getReply(cleanMessage, languageSelect.value);
  addMessage(reply, "bot");
  speak(reply);
}

form.addEventListener("submit", event => {
  event.preventDefault();
  sendMessage(input.value);
});

languageSelect.addEventListener("change", () => {
  if (recognition && listening) {
    recognition.stop();
  }

  statusText.textContent = "Language changed.";
});

micButton.addEventListener("click", () => {
  if (!SpeechRecognition) {
    statusText.textContent =
      "Speech recognition is unavailable. Try an updated Chrome browser.";
    return;
  }

  if (listening && recognition) {
    recognition.stop();
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = languageSelect.value;
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    listening = true;
    micButton.textContent = "🛑 Stop listening";
    statusText.textContent = "Listening... Speak now.";
  };

  recognition.onresult = event => {
    const transcript = event.results[0][0].transcript;
    sendMessage(transcript);
  };

  recognition.onerror = event => {
    statusText.textContent =
      "Microphone error: " + event.error +
      ". Check microphone permission and language support.";
  };

  recognition.onend = () => {
    listening = false;
    micButton.textContent = "🎙 Start speaking";
    if (statusText.textContent === "Listening... Speak now.") {
      statusText.textContent = "Ready to talk.";
    }
  };

  try {
    window.speechSynthesis.cancel();
    recognition.start();
  } catch (error) {
    statusText.textContent =
      "Could not start the microphone. Please try again.";
  }
});

stopButton.addEventListener("click", () => {
  window.speechSynthesis.cancel();

  if (recognition && listening) {
    recognition.stop();
  }

  statusText.textContent = "Speech stopped.";
});

window.speechSynthesis?.getVoices();

addMessage(greetings["en-IN"], "bot");
s