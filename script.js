
const languageSelect = document.getElementById("language");
const chat = document.getElementById("chat");
const form = document.getElementById("chatForm");
const input = document.getElementById("message");
const micButton = document.getElementById("micButton");
const stopButton = document.getElementById("stopButton");
const statusText = document.getElementById("status");

const BACKEND_URL =
  "https://arro-ai-backend.chintalasricharan7.workers.dev";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;
let listening = false;
let sending = false;

const greetings = {
  "en-IN": "Hello! I am ARRO. How can I help you today?",
  "te-IN": "నమస్కారం! నేను ARRO. మీకు ఎలా సహాయం చేయగలను?",
  "hi-IN": "नमस्ते! मैं ARRO हूँ। मैं आपकी क्या मदद कर सकता हूँ।"
};

function getLanguageName() {
  const languages = {
    "en-IN": "English",
    "te-IN": "Telugu",
    "hi-IN": "Hindi"
  };

  return languages[languageSelect.value] || "English";
}

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
  utterance.lang = languageSelect.value;
  utterance.rate = 0.95;
  utterance.pitch = 1;

  const voices = window.speechSynthesis.getVoices();
  const matchingVoice = voices.find(
    voice => voice.lang.toLowerCase() ===
      languageSelect.value.toLowerCase()
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

async function sendMessage(message) {
  const cleanMessage = message.trim();

  if (!cleanMessage || sending) return;

  addMessage(cleanMessage, "user");
  input.value = "";
  sending = true;
  form.querySelector('button[type="submit"]')?.setAttribute("disabled", "");

  statusText.textContent = "ARRO is thinking...";

  try {
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: cleanMessage,
        language: getLanguageName()
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "The AI service returned an error.");
    }

    if (!data.answer) {
      throw new Error("ARRO received an empty answer.");
    }

    addMessage(data.answer, "bot");
    speak(data.answer);

  } catch (error) {
    console.error("ARRO error:", error);

    let errorMessage =
      "Sorry, I could not connect to ARRO's AI service. Please try again.";

    if (error instanceof TypeError) {
      errorMessage =
        "Could not connect to the server. Check your internet connection and try again.";
    } else if (error.message) {
      errorMessage = error.message;
    }

    addMessage(errorMessage, "bot");
    statusText.textContent = "Connection problem. Please try again.";

  } finally {
    sending = false;
    form.querySelector('button[type="submit"]')?.removeAttribute("disabled");
  }
}

form.addEventListener("submit", event => {
  event.preventDefault();
  sendMessage(input.value);
});

languageSelect.addEventListener("change", () => {
  if (recognition && listening) {
    recognition.stop();
  }

  statusText.textContent = "Language changed to " + getLanguageName() + ".";
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
      ". Check microphone permission and your microphone device.";
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

if ("speechSynthesis" in window) {
  window.speechSynthesis.getVoices();
}

addMessage(greetings[languageSelect.value] || greetings["en-IN"], "bot");
