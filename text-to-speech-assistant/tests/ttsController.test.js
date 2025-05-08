const TTSController = require('../src/controllers/ttsController');
const textToSpeech = require('@google-cloud/text-to-speech');

// Mock the Google Cloud Text-to-Speech client
jest.mock('@google-cloud/text-to-speech');

describe('TTSController', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        // Reset mocks before each test
        mockReq = {
            body: {
                text: 'Hello, this is a test',
                voiceSettings: {
                    languageCode: 'en-US',
                    voiceId: 'en-US-Standard-A',
                    rate: 1.0,
                    pitch: 1.0,
                    volume: 1.0
                }
            }
        };

        mockRes = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };

        // Mock the Google Cloud TTS client methods
        textToSpeech.TextToSpeechClient.mockImplementation(() => ({
            synthesizeSpeech: jest.fn().mockResolvedValue([
                { audioContent: Buffer.from('mock audio content') }
            ]),
            listVoices: jest.fn().mockResolvedValue([
                {
                    voices: [
                        {
                            name: 'en-US-Standard-A',
                            languageCode: 'en-US',
                            ssmlGender: 'FEMALE'
                        }
                    ]
                }
            ])
        }));
    });

    describe('generateSpeech', () => {
        it('should generate speech successfully', async () => {
            await TTSController.generateSpeech(mockReq, mockRes);
            expect(mockRes.send).toHaveBeenCalled();
        });

        it('should return error when no text provided', async () => {
            mockReq.body.text = '';
            await TTSController.generateSpeech(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Text is required' });
        });

        it('should handle API errors gracefully', async () => {
            const client = new textToSpeech.TextToSpeechClient();
            client.synthesizeSpeech.mockRejectedValue(new Error('API Error'));
            
            await TTSController.generateSpeech(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to generate speech' });
        });
    });

    describe('getAvailableVoices', () => {
        it('should return list of available voices', async () => {
            await TTSController.getAvailableVoices(mockReq, mockRes);
            expect(mockRes.json).toHaveBeenCalledWith({
                voices: [
                    {
                        name: 'en-US-Standard-A',
                        languageCode: 'en-US',
                        ssmlGender: 'FEMALE'
                    }
                ]
            });
        });

        it('should handle API errors gracefully', async () => {
            const client = new textToSpeech.TextToSpeechClient();
            client.listVoices.mockRejectedValue(new Error('API Error'));
            
            await TTSController.getAvailableVoices(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to fetch available voices' });
        });
    });

    describe('Text preprocessing', () => {
        it('should convert numbers to words', () => {
            const text = 'I have 42 apples';
            const processed = TTSController.preprocessText(text);
            expect(processed).toBe('I have forty-two apples');
        });

        it('should handle abbreviations', () => {
            const text = 'Dr. Smith and Mr. Jones';
            const processed = TTSController.preprocessText(text);
            expect(processed).toBe('Doctor Smith and Mister Jones');
        });
    });
}); 