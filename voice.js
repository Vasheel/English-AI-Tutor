// Voice.js - Speech Recognition and Text-to-Speech implementation

// Check if Web Speech API is supported
const isSpeechApiSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
const isTtsApiSupported = 'SpeechSynthesisUtterance' in window;

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
const synth = window.speechSynthesis;

// UI Elements
const startSpeechBtn = document.getElementById('start-speech');
const startTtsBtn = document.getElementById('start-tts');

// Speech Recognition Configuration
recognition.continuous = false;
recognition.interimResults = false;

// Voice Control State
let isListening = false;
let isSpeaking = false;

// Event Listeners
startSpeechBtn.addEventListener('click', toggleSpeechRecognition);
startTtsBtn.addEventListener('click', speakCurrentText);

// Speech Recognition Events
recognition.onstart = () => {
  isListening = true;
  startSpeechBtn.classList.add('active');
};

recognition.onend = () => {
  isListening = false;
  startSpeechBtn.classList.remove('active');
};

recognition.onresult = (event) => {
  const speechResult = event.results[0][0].transcript;
  handleSpeechInput(speechResult);
};

// Text-to-Speech Functions
function speak(text) {
  if (!isTtsApiSupported) {
    console.error('Text-to-Speech API not supported');
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.9; // Speech rate (0.1 to 10)
  utterance.pitch = 1;  // Speech pitch (0 to 2)
  utterance.volume = 1; // Speech volume (0 to 1)

  synth.speak(utterance);
}

// Speech Recognition Functions
function toggleSpeechRecognition() {
  if (!isSpeechApiSupported) {
    console.error('Speech Recognition API not supported');
    return;
  }

  if (isListening) {
    recognition.stop();
  } else {
    recognition.start();
  }
}

// Handle speech input (you'll need to implement this based on your application logic)
function handleSpeechInput(text) {
  // TODO: Implement your logic to handle the speech input
  console.log('Speech recognized:', text);
}

// Speak current text (you'll need to modify this based on your application's text source)
function speakCurrentText() {
  // TODO: Get the current text you want to speak
  const textToSpeak = 'Hello! How can I assist you today?';
  speak(textToSpeak);
}

// Initialize UI
if (!isSpeechApiSupported) {
  startSpeechBtn.style.display = 'none';
}

if (!isTtsApiSupported) {
  startTtsBtn.style.display = 'none';
}
