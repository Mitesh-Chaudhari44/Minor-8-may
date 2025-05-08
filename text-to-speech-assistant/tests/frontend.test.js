/**
 * @jest-environment jsdom
 */

describe('Frontend functionality', () => {
    let app;

    beforeEach(() => {
        // Set up document body
        document.body.innerHTML = `
            <div class="container">
                <select id="voice-select">
                    <option value="en-US-Standard-A">Voice 1</option>
                </select>
                <select id="language-select">
                    <option value="en-US">English (US)</option>
                </select>
                <input type="range" id="rate" value="1.0">
                <input type="range" id="pitch" value="1.0">
                <input type="range" id="volume" value="1.0">
                <textarea id="text-input">Test text</textarea>
                <button id="speak-button">Speak</button>
                <button id="stop-button">Stop</button>
                <button id="save-button">Save</button>
                <audio id="audio-output"></audio>
            </div>
        `;

        // Mock fetch
        global.fetch = jest.fn();

        // Import and initialize the app
        require('../public/app.js');
        app = new TTSApp();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('Voice loading', () => {
        it('should load available voices', async () => {
            const mockVoices = {
                voices: [
                    {
                        name: 'en-US-Standard-A',
                        languageCode: 'en-US',
                        ssmlGender: 'FEMALE'
                    }
                ]
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockVoices)
            });

            await app.loadVoices();
            const voiceSelect = document.getElementById('voice-select');
            expect(voiceSelect.options.length).toBeGreaterThan(0);
        });

        it('should handle voice loading errors', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Failed to load voices'));
            
            const consoleSpy = jest.spyOn(console, 'error');
            await app.loadVoices();
            expect(consoleSpy).toHaveBeenCalled();
        });
    });

    describe('Speech generation', () => {
        it('should generate speech when speak button is clicked', async () => {
            const mockAudioBlob = new Blob(['mock audio data'], { type: 'audio/mp3' });
            global.fetch.mockResolvedValueOnce({
                ok: true,
                blob: () => Promise.resolve(mockAudioBlob)
            });

            const speakButton = document.getElementById('speak-button');
            await speakButton.click();

            expect(global.fetch).toHaveBeenCalledWith('/api/tts', expect.any(Object));
        });

        it('should handle empty text input', async () => {
            const textInput = document.getElementById('text-input');
            textInput.value = '';

            const speakButton = document.getElementById('speak-button');
            const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
            
            await speakButton.click();
            expect(alertMock).toHaveBeenCalledWith('Please enter some text');
        });
    });

    describe('Audio controls', () => {
        it('should stop audio playback when stop button is clicked', () => {
            const audioOutput = document.getElementById('audio-output');
            const stopButton = document.getElementById('stop-button');

            // Mock audio methods
            audioOutput.pause = jest.fn();
            
            stopButton.click();
            expect(audioOutput.pause).toHaveBeenCalled();
            expect(audioOutput.currentTime).toBe(0);
        });
    });

    describe('Voice settings', () => {
        it('should update slider values when changed', () => {
            const rateInput = document.getElementById('rate');
            const rateValue = document.getElementById('rate-value');

            rateInput.value = '1.5';
            rateInput.dispatchEvent(new Event('input'));

            expect(rateValue.textContent).toBe('1.5');
        });
    });
}); 