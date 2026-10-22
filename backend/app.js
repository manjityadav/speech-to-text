
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { GoogleGenAI, Modality } from "@google/genai";

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Speech-to-Text API is running",
  });
});

const wss = new WebSocketServer({
  server,
  path: "/ws/transcribe",
});

wss.on("connection", async (client, request) => {
  let session;
  let stopping = false;

  const sendToClient = (payload) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(payload));
    }
  };

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const connectionUrl = new URL(request.url, "http://localhost");
    const selectedLanguage =
      connectionUrl.searchParams.get("language") || "auto";

    const languageCodes =
      selectedLanguage === "hi"
        ? ["hi-IN"]
        : selectedLanguage === "en"
          ? ["en-IN"]
          : [];

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    session = await ai.live.connect({
      model: "gemini-3.5-transcribe-live",
      config: {
        responseModalities: [Modality.TEXT],
        inputAudioTranscription: {
          languageCodes,
        },
      },
      callbacks: {
        onmessage: (message) => {
          if (message.setupComplete) {
            sendToClient({ type: "ready" });
          }

          const content = message.serverContent;
          if (!content) return;

          if (content.interimInputTranscription?.text) {
            sendToClient({
              type: "interim",
              text: content.interimInputTranscription.text,
            });
          }

          if (content.inputTranscription?.text) {
            sendToClient({
              type: "final",
              text: content.inputTranscription.text,
            });
          }
        },

        onerror: (error) => {
          console.error("Gemini Live error:", error.message);
          sendToClient({
            type: "error",
            message: "Gemini Live encountered an error. Check the backend terminal.",
          });
        },

        onclose: () => {
          sendToClient({ type: "service-closed" });
        },
      },
    });
  } catch (error) {
    console.error("Could not start Gemini session:", error);

    sendToClient({
      type: "error",
      message: "Could not connect to Gemini. Check the backend terminal.",
    });

    client.close();
    return;
  }

  client.on("message", async (raw) => {
    try {
      const message = JSON.parse(raw.toString());

      if (message.type === "audio" && !stopping) {
        if (
          typeof message.data !== "string" ||
          message.data.length > 100_000
        ) {
          return;
        }

        session.sendRealtimeInput({
          audio: {
            data: message.data,
            mimeType: "audio/pcm;rate=16000",
          },
        });
      }

      if (message.type === "stop" && !stopping) {
        stopping = true;

        session.sendRealtimeInput({
          audioStreamEnd: true,
        });

        setTimeout(() => {
          session?.close();
          sendToClient({ type: "stopped" });
          client.close();
        }, 1500);
      }
    } catch (error) {
      console.error("WebSocket message error:", error);
      sendToClient({
        type: "error",
        message: "Could not process the audio stream.",
      });
    }
  });

  client.on("close", () => {
    session?.close();
  });

  client.on("error", (error) => {
    console.error("Client WebSocket error:", error.message);
    session?.close();
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(
    `Transcription WebSocket: ws://localhost:${PORT}/ws/transcribe`
  );

  if (!process.env.GEMINI_API_KEY) {
    console.error("Missing GEMINI_API_KEY in backend/.env");
  }
});
