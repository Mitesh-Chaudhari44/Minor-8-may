class TTSApp {
    constructor() {
        this.initializeElements();
        this.initializeWebSpeech();
        this.initializeEventListeners();
        this.loadVoices();
    }

    initializeElements() {
        // Controls
        this.engineSelect = document.getElementById('engine-select');
        this.voiceSelect = document.getElementById('voice-select');
        this.languageSelect = document.getElementById('language-select');
        this.rateInput = document.getElementById('rate');
        this.pitchInput = document.getElementById('pitch');
        this.volumeInput = document.getElementById('volume');
        this.textInput = document.getElementById('text-input');
        
        // Buttons
        this.speakButton = document.getElementById('speak-button');
        this.stopButton = document.getElementById('stop-button');
        this.saveButton = document.getElementById('save-button');
        
        // Display elements
        this.rateValue = document.getElementById('rate-value');
        this.pitchValue = document.getElementById('pitch-value');
        this.volumeValue = document.getElementById('volume-value');
        this.audioOutput = document.getElementById('audio-output');

        // Initialize values
        this.updateSliderValue(this.rateInput, this.rateValue);
        this.updateSliderValue(this.pitchInput, this.pitchValue);
        this.updateSliderValue(this.volumeInput, this.volumeValue);
    }

    initializeWebSpeech() {
        this.synthesis = window.speechSynthesis;
        this.browserVoices = [];

        // Load browser voices
        if (this.synthesis) {
            // Chrome loads voices asynchronously
            if (this.synthesis.onvoiceschanged !== undefined) {
                this.synthesis.onvoiceschanged = () => {
                    this.browserVoices = this.synthesis.getVoices();
                    this.updateVoiceList();
                };
            }
            // Firefox and others load voices immediately
            this.browserVoices = this.synthesis.getVoices();
            this.updateVoiceList();
        }
    }

    initializeEventListeners() {
        // Engine change event
        this.engineSelect.addEventListener('change', () => this.onEngineChange());

        // Slider events
        this.rateInput.addEventListener('input', () => this.updateSliderValue(this.rateInput, this.rateValue));
        this.pitchInput.addEventListener('input', () => this.updateSliderValue(this.pitchInput, this.pitchValue));
        this.volumeInput.addEventListener('input', () => this.updateSliderValue(this.volumeInput, this.volumeValue));

        // Language change event
        this.languageSelect.addEventListener('change', () => this.updateVoiceList());

        // Button events
        this.speakButton.addEventListener('click', () => this.speak());
        this.stopButton.addEventListener('click', () => this.stop());
        this.saveButton.addEventListener('click', () => this.saveAudio());
    }

    updateSliderValue(slider, display) {
        display.textContent = parseFloat(slider.value).toFixed(1);
    }

    onEngineChange() {
        const engine = this.engineSelect.value;
        this.saveButton.style.display = engine === 'browser' ? 'none' : 'inline-block';
        this.updateVoiceList();
    }

    async loadVoices() {
        try {
            const response = await fetch('/api/voices');
            const data = await response.json();
            
            // Store server voices
            this.serverVoices = data.voices;
            this.updateVoiceList();
        } catch (error) {
            console.error('Error loading voices:', error);
            this.showError('Failed to load voices');
        }
    }

    updateVoiceList() {
        const engine = this.engineSelect.value;
        const languageCode = this.languageSelect.value;
        
        // Clear existing options
        this.voiceSelect.innerHTML = '';

        let voices = [];
        if (engine === 'browser') {
            voices = this.browserVoices.filter(voice => voice.lang.startsWith(languageCode));
        } else {
            voices = this.serverVoices[engine].filter(voice => voice.languageCode === languageCode);
        }

        // Add voices to select element
        voices.forEach(voice => {
            const option = document.createElement('option');
            option.value = engine === 'browser' ? voice.voiceURI : voice.name;
            option.textContent = `${voice.name} (${voice.gender || voice.voiceURI})`;
            this.voiceSelect.appendChild(option);
        });
    }

    async speak() {
        const text = this.textInput.value.trim();
        if (!text) {
            this.showError('Please enter some text');
            return;
        }

        try {
            this.speakButton.disabled = true;
            const engine = this.engineSelect.value;
            
            if (engine === 'browser') {
                this.speakWithBrowser(text);
            } else {
                await this.speakWithServer(text, engine);
            }
        } catch (error) {
            console.error('Error generating speech:', error);
            this.showError('Failed to generate speech');
            this.speakButton.disabled = false;
        }
    }

    speakWithBrowser(text) {
        // Stop any ongoing speech
        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set voice
        const voice = this.browserVoices.find(v => v.voiceURI === this.voiceSelect.value);
        if (voice) {
            utterance.voice = voice;
        }

        // Set other properties
        utterance.rate = parseFloat(this.rateInput.value);
        utterance.pitch = parseFloat(this.pitchInput.value);
        utterance.volume = parseFloat(this.volumeInput.value);
        utterance.lang = this.languageSelect.value;

        // Events
        utterance.onend = () => {
            this.speakButton.disabled = false;
        };

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            this.speakButton.disabled = false;
            this.showError('Speech synthesis failed');
        };

        // Speak
        this.synthesis.speak(utterance);
    }

    async speakWithServer(text, engine) {
        const voiceSettings = {
            engine,
            voiceId: this.voiceSelect.value,
            languageCode: this.languageSelect.value,
            rate: parseFloat(this.rateInput.value),
            pitch: parseFloat(this.pitchInput.value),
            volume: parseFloat(this.volumeInput.value)
        };

        const response = await fetch('/api/tts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text,
                voiceSettings
            })
        });

        if (!response.ok) {
            throw new Error('Failed to generate speech');
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        this.audioOutput.src = audioUrl;
        await this.audioOutput.play();
        this.speakButton.disabled = false;
    }

    stop() {
        const engine = this.engineSelect.value;
        
        if (engine === 'browser') {
            this.synthesis.cancel();
        } else {
            this.audioOutput.pause();
            this.audioOutput.currentTime = 0;
        }
        
        this.speakButton.disabled = false;
    }

    async saveAudio() {
        if (this.engineSelect.value === 'browser') {
            this.showError('Saving audio is not supported with the browser engine');
            return;
        }

        const text = this.textInput.value.trim();
        if (!text) {
            this.showError('Please enter some text');
            return;
        }

        try {
            const voiceSettings = {
                engine: this.engineSelect.value,
                voiceId: this.voiceSelect.value,
                languageCode: this.languageSelect.value,
                rate: parseFloat(this.rateInput.value),
                pitch: parseFloat(this.pitchInput.value),
                volume: parseFloat(this.volumeInput.value)
            };

            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text,
                    voiceSettings
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate speech');
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            const a = document.createElement('a');
            a.href = audioUrl;
            a.download = 'speech.mp3';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(audioUrl);
        } catch (error) {
            console.error('Error saving audio:', error);
            this.showError('Failed to save audio');
        }
    }

    showError(message) {
        alert(message);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new TTSApp();
}); 