# SpeechText — Real-Time Speech to Text

SpeechText is a web application that converts spoken words into text in real time. It supports English, Hindi, and automatic English–Hindi transcription, allowing users to record speech, review and edit transcripts, and save their work for later.

## ✨ Features

- **Real-Time Transcription:** Convert speech into text while speaking.
- **Multilingual Support:** Choose English, Hindi, or automatic English–Hindi transcription.
- **Live Recording:** Start and stop microphone recording directly from the browser.
- **Transcript Editor:** Review and edit generated text before saving.
- **Transcript History:** View previously saved transcripts with their titles and timestamps.
- **Persistent Storage:** Store transcripts in a PostgreSQL database.
- **Transcript Management:** Open saved transcripts and delete unwanted records.
- **Copy to Clipboard:** Copy transcript text for use in other applications.
- **Responsive Interface:** Use the application on desktop and mobile screens.
- **Cloud Deployment:** Deploy the frontend and backend independently.

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Real-Time Communication | WebSockets |
| Speech Transcription | Google Gemini Live API |
| Database | PostgreSQL |
| ORM | Prisma |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
| Database Hosting | Neon |

## 🏗️ Architecture

```text
User
  │
  ▼
React Frontend (Vercel)
  │
  ├── WebSocket ──────────────┐
  │                           ▼
  │                    Express Backend
  │                           │
  │                           ▼
  │                    Gemini Live API
  │                           │
  │                    Transcription
  │                           │
  ◄───────────────────────────┘
  │
  └── REST API ─────────► Express Backend
                              │
                              ▼
                       Prisma ORM
                              │
                              ▼
                       Neon PostgreSQL
```

The frontend communicates with the backend using REST APIs for transcript management and WebSockets for real-time transcription.

## 📂 Project Structure

```text
speech-to-text/
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── transcripts.js
│   │   ├── components/
│   │   │   └── hooks/
│   │   │       └── useTranscription.js
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── routes/
│   │   └── transcriptRoutes.js
│   ├── prisma/
│   │   └── schema.prisma
│   ├── prisma.js
│   ├── server.js
│   └── package.json
│
└── README.md
```

## ⚙️ Prerequisites

Before running the project, install:

- [Node.js](https://nodejs.org/)
- npm
- A [Google AI Studio](https://aistudio.google.com/) API key with access to the configured Gemini Live model
- A PostgreSQL database, such as [Neon](https://neon.tech/)

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/speech-to-text.git
cd speech-to-text
```

Replace `YOUR_USERNAME` with your GitHub username.

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` directory:

```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=your_postgresql_connection_string
```

Replace the example values with your own credentials. Never commit your `.env` file or expose your API keys.

### 3. Configure the database

Ensure your Prisma schema is configured to use PostgreSQL and the `DATABASE_URL` environment variable.

Generate the Prisma Client and apply the existing migrations:

```bash
npx prisma generate
npx prisma migrate deploy
```

If you are creating the database schema for the first time in development and have not created a migration yet, create one with:

```bash
npx prisma migrate dev --name init
```

### 4. Start the backend

```bash
npm start
```

If your `backend/package.json` does not define a `start` script, run:

```bash
node server.js
```

The backend should be available at:

```text
http://localhost:5000
```

### 5. Set up the frontend

Open another terminal from the project root:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

This variable is used to configure the backend API URL. The WebSocket connection should derive its URL from the same variable.

### 6. Start the frontend

```bash
npm run dev
```

Open the local URL displayed by Vite, usually:

```text
http://localhost:5173
```

Allow microphone access when prompted by the browser.

## 🔌 API Endpoints

### Health Check

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Check backend availability |

### Transcript Management

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/transcripts` | Retrieve saved transcripts |
| GET | `/api/transcripts/:id` | Retrieve a transcript by ID |
| POST | `/api/transcripts` | Create a transcript |
| PATCH | `/api/transcripts/:id` | Update a transcript |
| DELETE | `/api/transcripts/:id` | Delete a transcript |

### Create a Transcript

**Request:** `POST /api/transcripts`

```json
{
  "title": "Meeting Notes",
  "content": "Today's discussion covered project progress.",
  "language": "en"
}
```

The API validates the required title and content fields before saving a transcript.

### Real-Time Transcription

The backend exposes a WebSocket endpoint:

```text
/ws/transcribe?language=auto
```

Supported language options:

- `auto` — English and Hindi
- `en` — English
- `hi` — Hindi

The client streams microphone audio through the WebSocket connection and receives transcription events from the backend.

## ☁️ Deployment

### Backend — Render

1. Connect the GitHub repository to Render.
2. Set the root directory to `backend`.
3. Configure the build command to install dependencies and generate Prisma Client.
4. Set the start command to run `server.js`.
5. Configure `GEMINI_API_KEY` and `DATABASE_URL` in the service environment.
6. Apply database migrations during deployment when needed.

### Database — Neon

1. Create a PostgreSQL database.
2. Copy its connection string.
3. Configure `DATABASE_URL` in the backend environment.
4. Apply Prisma migrations before using transcript endpoints.

### Frontend — Vercel

1. Import the GitHub repository into Vercel.
2. Set the root directory to `frontend`.
3. Set the framework preset to Vite.
4. Configure the environment variable:

```env
VITE_API_URL=https://your-backend.onrender.com
```

Replace the example URL with your actual backend URL.

The frontend must use the deployed backend URL for REST requests and a secure WebSocket URL (`wss://`) for real-time transcription when served over HTTPS.

After pushing changes to the connected GitHub branch, Vercel can automatically build and deploy the updated frontend.

## 🔐 Security Notes

- Keep API keys and database credentials in environment variables.
- Never commit `.env` files.
- Configure CORS to allow only the intended frontend origins in production.
- Use HTTPS and secure WebSockets in production.
- Do not expose the Gemini API key in frontend code or Vite environment variables.

## 🧪 Testing Checklist

- [ ] Backend health endpoint responds successfully.
- [ ] Microphone permission is granted.
- [ ] Real-time transcription works in English.
- [ ] Hindi and automatic language modes work.
- [ ] Transcripts can be saved to PostgreSQL.
- [ ] Saved transcripts appear in history after refreshing.
- [ ] Existing transcripts can be opened and reviewed.
- [ ] Transcript deletion works.
- [ ] Production API and WebSocket connections use the deployed backend.

## 🔮 Future Improvements

- User authentication and private transcript ownership.
- Search, filtering, and pagination for transcript history.
- Editing saved transcripts and persisting changes.
- Export transcripts as TXT, PDF, or DOCX.
- Improved audio resampling and recording recovery.
- Automated backend and frontend tests.

## 👨‍💻 Author

**Manjeet Kumar Yadav**

- GitHub: [@manjityadav](https://github.com/manjityadav)
- LinkedIn: [Manjeet Yadav](https://www.linkedin.com/in/manjith-yadav/)

---

If you find this project useful, consider giving the repository a ⭐ on GitHub.
