const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600 });

class TTSController {
    static voices = {
        'browser': [], // Web Speech API voices
        'espeak': [   // eSpeak voices
            { name: 'en-US-male', languageCode: 'en-US', gender: 'MALE' },
            { name: 'en-US-female', languageCode: 'en-US', gender: 'FEMALE' },
            { name: 'es-ES-male', languageCode: 'es-ES', gender: 'MALE' },
            { name: 'fr-FR-female', languageCode: 'fr-FR', gender: 'FEMALE' }
        ]
    };

    static async generateSpeech(req, res) {
        try {
            const { text, voiceSettings } = req.body;

            if (!text) {
                return res.status(400).json({ error: 'Text is required' });
            }

            // Process text for better pronunciation
            const processedText = TTSController.preprocessText(text);

            // Generate audio using selected engine
            let audioBuffer;
            switch (voiceSettings.engine || 'browser') {
                case 'browser':
                    // Web Speech API doesn't generate audio files directly
                    // Instead, we'll send SSML that the frontend can use
                    return res.json({
                        type: 'browser',
                        ssml: TTSController.createSSML(processedText, voiceSettings)
                    });

                case 'espeak':
                    audioBuffer = await TTSController.generateWithEspeak(processedText, voiceSettings);
                    break;

                default:
                    return res.status(400).json({ error: 'Invalid TTS engine specified' });
            }

            res.set('Content-Type', 'audio/mp3');
            res.send(audioBuffer);
        } catch (error) {
            console.error('Error generating speech:', error);
            res.status(500).json({ error: 'Failed to generate speech' });
        }
    }

    static async getAvailableVoices(req, res) {
        try {
            res.json({ voices: {
                browser: TTSController.voices.browser,
                espeak: TTSController.voices.espeak
            }});
        } catch (error) {
            console.error('Error fetching voices:', error);
            res.status(500).json({ error: 'Failed to fetch available voices' });
        }
    }

    static async generateWithEspeak(text, voiceSettings) {
        // We'll implement eSpeak synthesis here
        // This is a placeholder that returns an empty buffer
        return Buffer.from([]);
    }

    static createSSML(text, voiceSettings) {
        const ssml = `
            <speak version="1.1"
                   xmlns="http://www.w3.org/2001/10/synthesis"
                   xml:lang="${voiceSettings.languageCode || 'en-US'}">
                <prosody rate="${voiceSettings.rate || 1}"
                         pitch="${voiceSettings.pitch || 1}"
                         volume="${voiceSettings.volume || 1}">
                    ${text}
                </prosody>
            </speak>`;
        return ssml;
    }

    static preprocessText(text) {
        // Convert numbers to words
        text = text.replace(/\d+/g, (num) => {
            return TTSController.numberToWords(parseInt(num));
        });

        // Handle common abbreviations
        const abbreviations = {
            'Dr.': 'Doctor',
            'Mr.': 'Mister',
            'Mrs.': 'Misses',
            'Ms.': 'Miss',
            'Prof.': 'Professor',
            // Add more abbreviations as needed
        };

        for (const [abbr, full] of Object.entries(abbreviations)) {
            text = text.replace(new RegExp(abbr, 'g'), full);
        }

        return text;
    }

    static numberToWords(num) {
        const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
        const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
        const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

        if (num === 0) return 'zero';

        if (num < 10) return ones[num];
        if (num < 20) return teens[num - 10];
        if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? '-' + ones[num % 10] : '');
        
        return ones[Math.floor(num / 100)] + ' hundred' + (num % 100 ? ' and ' + TTSController.numberToWords(num % 100) : '');
    }
}

module.exports = TTSController; 