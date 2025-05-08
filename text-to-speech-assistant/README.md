# AI Text-to-Speech Assistant

A modern text-to-speech application that converts text into natural-sounding speech with customizable voice characteristics. Built with Node.js and Google Cloud Text-to-Speech API.

## Features

- Natural-sounding speech with appropriate prosody and intonation
- Multiple voice options (male, female, different ages, accents)
- Support for multiple languages
- Customizable speaking rate, pitch, and volume
- High-quality audio output (16kHz+ sample rate)
- Save generated speech as audio files
- Modern, responsive UI
- Low latency response
- Proper handling of numbers, dates, and special characters
- SSML support for fine control over speech synthesis

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- Google Cloud Platform account with Text-to-Speech API enabled
- Google Cloud credentials (service account key)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd text-to-speech-assistant
```

2. Install dependencies:
```bash
npm install
```

3. Set up Google Cloud credentials:
   - Create a service account in Google Cloud Console
   - Download the JSON key file
   - Rename it to `google-credentials.json`
   - Place it in the `config` directory

4. Create a `.env` file in the root directory:
```env
PORT=3000
GOOGLE_APPLICATION_CREDENTIALS=./config/google-credentials.json
NODE_ENV=development
```

## Usage

1. Start the development server:
```bash
npm run dev
```

2. Open your browser and navigate to `http://localhost:3000`

3. Enter text in the input field and customize voice settings:
   - Select language and voice
   - Adjust speed, pitch, and volume
   - Click "Speak" to generate and play speech
   - Use "Save Audio" to download the generated speech as an MP3 file

## API Endpoints

- `POST /api/tts`
  - Generates speech from text
  - Request body: `{ text: string, voiceSettings: object }`
  - Returns: Audio file (MP3)

- `GET /api/voices`
  - Lists available voices
  - Returns: `{ voices: array }`

## Development

- Run in development mode: `npm run dev`
- Run tests: `npm test`
- Build for production: `npm run build`

## Technical Details

### Voice Settings

```javascript
{
  voiceId: string,      // Voice identifier
  languageCode: string, // e.g., 'en-US'
  rate: number,         // 0.5 to 2.0
  pitch: number,        // 0.5 to 2.0
  volume: number        // 0.0 to 1.0
}
```

### Audio Specifications

- Sample Rate: 16kHz or higher
- Format: MP3
- Channels: Mono/Stereo (configurable)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Google Cloud Text-to-Speech API
- Node.js community
- Contributors and testers 