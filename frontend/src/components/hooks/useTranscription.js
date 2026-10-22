
import { useCallback, useEffect, useRef, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const WS_URL = API_URL.replace(/^http/, "ws") + "/ws/transcribe";

function floatToBase64PCM(samples) {
  const pcm = new Int16Array(samples.length);

  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    pcm[i] = sample < 0 ? sample * 32768 : sample * 32767;
  }

  const bytes = new Uint8Array(pcm.buffer);
  let binary = "";

  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

export default function useTranscription(language = "auto") {
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState("");
  const [recordingStatus, setRecordingStatus] = useState("Ready");

  const socketRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const sourceRef = useRef(null);
  const processorRef = useRef(null);
  const gainRef = useRef(null);

  const readyRef = useRef(false);
  const mountedRef = useRef(true);
  const baseTranscriptRef = useRef("");
  const committedTextRef = useRef("");
  const interimTextRef = useRef("");

  const cleanupAudio = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.onaudioprocess = null;
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    sourceRef.current?.disconnect();
    sourceRef.current = null;

    gainRef.current?.disconnect();
    gainRef.current = null;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    const context = audioContextRef.current;
    audioContextRef.current = null;

    if (context && context.state !== "closed") {
      context.close().catch(() => {});
    }
  }, []);

  const stopRecording = useCallback(() => {
    readyRef.current = false;
    cleanupAudio();

    const socket = socketRef.current;

    if (socket?.readyState === WebSocket.OPEN) {
      if (mountedRef.current) {
        setRecordingStatus("Finishing transcript...");
      }

      socket.send(JSON.stringify({ type: "stop" }));
    } else {
      socket?.close();
      socketRef.current = null;

      if (mountedRef.current) {
        setIsRecording(false);
        setRecordingStatus("Ready");
      }
    }
  }, [cleanupAudio]);

  const startRecording = useCallback(() => {
    if (socketRef.current) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setRecordingError(
        "Microphone access is unavailable. Open the app on localhost or HTTPS."
      );
      return;
    }

    setRecordingError("");
    setRecordingStatus("Connecting...");

    baseTranscriptRef.current = transcript.trim()
      ? `${transcript.trim()} `
      : "";

    committedTextRef.current = "";
    interimTextRef.current = "";
    readyRef.current = false;

    let socket;

    try {
      const url = new URL(WS_URL);
      url.searchParams.set("language", language);
      socket = new WebSocket(url.toString());
    } catch {
      setRecordingError("The transcription WebSocket URL is invalid.");
      setRecordingStatus("Error");
      return;
    }

    socketRef.current = socket;

    socket.onmessage = async (event) => {
      let message;

      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }

      if (message.type === "ready") {
        if (readyRef.current) return;
        readyRef.current = true;

        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              channelCount: 1,
              echoCancellation: true,
              noiseSuppression: true,
            },
          });

          if (
            socket !== socketRef.current ||
            socket.readyState !== WebSocket.OPEN
          ) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }

          streamRef.current = stream;

          const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

          const context = new AudioContextClass({ sampleRate: 16000 });
          audioContextRef.current = context;

          await context.resume();

          const source = context.createMediaStreamSource(stream);
          const processor = context.createScriptProcessor(2048, 1, 1);
          const gain = context.createGain();

          gain.gain.value = 0;

          processor.onaudioprocess = (audioEvent) => {
            if (
              !readyRef.current ||
              socket.readyState !== WebSocket.OPEN
            ) {
              return;
            }

            const samples = audioEvent.inputBuffer.getChannelData(0);

            // The AudioContext is requested at 16 kHz.
            // If the browser chooses another rate, resampling is required.
            if (context.sampleRate !== 16000) {
              setRecordingError(
                "Your browser audio rate is not 16 kHz. Try Chrome."
              );
              return;
            }

            const data = floatToBase64PCM(samples);

            socket.send(JSON.stringify({ type: "audio", data }));
          };

          source.connect(processor);
          processor.connect(gain);
          gain.connect(context.destination);

          sourceRef.current = source;
          processorRef.current = processor;
          gainRef.current = gain;

          setIsRecording(true);
          setRecordingStatus("Listening...");
        } catch (error) {
          readyRef.current = false;
          cleanupAudio();

          setRecordingError(
            error.name === "NotAllowedError"
              ? "Microphone permission was denied. Allow it in browser settings."
              : "Could not access your microphone."
          );

          if (socket.readyState === WebSocket.OPEN) socket.close();
          return;
        }
      }

      if (message.type === "interim") {
        interimTextRef.current = message.text || "";

        setTranscript(
          baseTranscriptRef.current +
            committedTextRef.current +
            interimTextRef.current
        );
      }

      if (message.type === "final") {
        const finalText = (message.text || "").trim();

        if (finalText) {
          committedTextRef.current +=
            (committedTextRef.current ? " " : "") + finalText;
        }

        interimTextRef.current = "";

        setTranscript(
          baseTranscriptRef.current + committedTextRef.current
        );
      }

      if (message.type === "error") {
        readyRef.current = false;
        cleanupAudio();

        setRecordingError(
          message.message || "The transcription service failed."
        );
        setRecordingStatus("Error");
        setIsRecording(false);

        if (socket.readyState === WebSocket.OPEN) socket.close();
      }

      if (message.type === "stopped") {
        readyRef.current = false;
        cleanupAudio();
        setIsRecording(false);
        setRecordingStatus("Ready");

        if (socketRef.current === socket) {
          socketRef.current = null;
        }

        if (socket.readyState === WebSocket.OPEN) socket.close();
      }
    };

    socket.onerror = () => {
      if (!mountedRef.current) return;

      setRecordingError(
        "Could not connect to the transcription backend. Check that it is running."
      );
    };

    socket.onclose = () => {
      readyRef.current = false;
      cleanupAudio();

      if (socketRef.current === socket) {
        socketRef.current = null;
      }

      if (mountedRef.current) {
        setIsRecording(false);
        setRecordingStatus("Ready");
      }
    };
  }, [transcript, language, cleanupAudio]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      readyRef.current = false;
      cleanupAudio();

      const socket = socketRef.current;
      socketRef.current = null;

      if (socket) {
        socket.onclose = null;
        socket.close();
      }
    };
  }, [cleanupAudio]);

  return {
    transcript,
    setTranscript,
    isRecording,
    recordingError,
    recordingStatus,
    startRecording,
    stopRecording,
  };
}
