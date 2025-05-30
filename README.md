# DocuMind

An AI-powered document management and learning platform that helps users process, analyze, and learn from their documents efficiently.

## Features

- 📄 Document Processing with Google Cloud Document AI
- 📚 Support for multiple file formats (PDF, DOCX, PPTX, Images)
- 🔍 Advanced text extraction and analysis
- 💾 Google Drive integration for document storage
- 🎯 Flashcard generation for effective learning
- 🔐 Secure authentication and authorization
- 📱 Responsive design for all devices

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **AI Services**: Google Cloud Document AI, DeepSeek
- **Storage**: Google Drive API
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS

## Prerequisites

- Node.js 18.x or higher
- MongoDB instance
- Google Cloud Platform account with Document AI enabled
- Google Drive API credentials
- DeepSeek API key

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Google Cloud
GCP_PROJECT_ID=your_project_id
GCP_LOCATION=your_location
GCP_PROCESSOR_OCR=your_processor_id
GCP_PROCESSOR_LAYOUT=your_processor_id
SERVICE_EMAIL=your_service_account_email
SERVICE_KEY=your_service_account_key

# DeepSeek
DEEPSEEK_API_KEY=your_deepseek_api_key
```

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/documind.git
   cd documind
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing

We use several testing methods to ensure code quality:

### Unit Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

Our unit tests use Jest and React Testing Library to test individual components and utilities.

### Integration Testing

```bash
# Run integration tests
npm run test:integration
```

Integration tests verify the interaction between different parts of the application.

### E2E Testing

```bash
# Run end-to-end tests
npm run test:e2e
```

E2E tests use Cypress to test the application from a user's perspective.

### API Testing

```bash
# Run API tests
npm run test:api
```

API tests verify the functionality of our Next.js API routes.

## Project Structure

```
documind/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── api/            # API routes
│   │   └── ...            # Page components
│   ├── components/         # Reusable components
│   ├── lib/               # Utility functions
│   └── types/             # TypeScript type definitions
├── public/                # Static assets
├── tests/                 # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── ...
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@documind.com or open an issue in the repository.
