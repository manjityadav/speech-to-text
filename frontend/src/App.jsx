
import { useState } from "react";
import useTranscription from "./components/hooks/useTranscription.js";

const LANGUAGES = [
  { id: "auto", label: "English + Hindi" },
  { id: "en", label: "English" },
  { id: "hi", label: "हिन्दी" },
];

const BARS = [
  18, 34, 22, 52, 40, 68, 30, 84, 46, 72, 28, 60,
  36, 78, 24, 56, 38, 64, 20, 44, 30, 50, 22, 36,
];

const Icon = ({ d, className = "h-5 w-5" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);

const MIC =
  "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Zm-6 9a6 6 0 0 0 12 0m-6 6v3";

const CLOCK =
  "M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z";

const DOC =
  "M7 3h7l5 5v13H7V3Zm7 0v5h5M10 13h6m-6 4h6";

const COPY = "M9 9h10v12H9V9Zm-4 8V3h10";

const TRASH =
  "M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3";

export default function App() {
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("auto");
  const [copied, setCopied] = useState(false);

  const {
    transcript,
    setTranscript,
    isRecording,
    recordingError,
    recordingStatus,
    startRecording,
    stopRecording,
  } = useTranscription(language);

  const words = transcript.trim()
    ? transcript.trim().split(/\s+/).length
    : 0;

  const handleCopy = async () => {
    if (!transcript) return;

    try {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const handleClear = () => {
    if (isRecording) return;

    setTranscript("");
  };

  const handleSave = () => {
    // This is a temporary placeholder.
    // We'll connect this to the PostgreSQL API next.
    window.alert("Database saving is the next step.");
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 md:flex">
      <style>{`
        @keyframes st-idle {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(.55); }
        }

        .st-bar {
          transform-origin: center;
          animation: st-idle 1.2s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .st-bar { animation: none; }
        }
      `}</style>

      {/* Sidebar */}
      <aside className="flex w-full flex-col bg-slate-900 p-6 text-slate-300 md:fixed md:inset-y-0 md:w-64">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500 text-white">
            <Icon d={MIC} className="h-5 w-5" />
          </div>

          <h2 className="text-xl font-bold tracking-tight text-white">
            SpeechText<span className="text-violet-400">.</span>
          </h2>
        </div>

        <nav className="mt-10 space-y-1" aria-label="Workspace">
          <p className="mb-3 px-3 text-xs font-medium text-slate-500">
            Workspace
          </p>

          <a
            href="#new"
            className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2.5 text-sm font-semibold text-white"
          >
            <Icon d={MIC} className="h-4 w-4 text-violet-400" />
            New transcription
          </a>

          <a
            href="#history"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-white/5 hover:text-white"
          >
            <Icon d={CLOCK} className="h-4 w-4" />
            History
          </a>
        </nav>

        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4 text-sm md:mt-auto">
          <p className="font-semibold text-white">Speak, then edit</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Your words appear in the editor as you talk. Review them before
            saving.
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="w-full px-5 py-8 md:ml-64 md:px-12 md:py-12">
        <div className="mx-auto max-w-3xl">
          <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                Speech to text
              </h1>
              <p className="mt-2 text-slate-500">
                Turn your voice into clean, editable text.
              </p>
            </div>

            <span
              className={`inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-slate-200 ${
                isRecording ? "text-red-600" : "text-emerald-700"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isRecording
                    ? "animate-pulse bg-red-500"
                    : "bg-emerald-500"
                }`}
              />
              {isRecording ? "Recording" : recordingStatus}
            </span>
          </header>

          {/* Recorder */}
          <section
            id="new"
            className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/70 ring-1 ring-slate-200"
          >
            <div className="bg-slate-900 px-6 pb-8 pt-6 md:px-9">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-400">Language</p>

                <div
                  role="radiogroup"
                  aria-label="Recognition language"
                  className="flex rounded-full bg-white/10 p-1"
                >
                  {LANGUAGES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={language === item.id}
                      disabled={isRecording}
                      onClick={() => setLanguage(item.id)}
                      className={`rounded-full px-4 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 disabled:cursor-not-allowed disabled:opacity-60 ${
                        language === item.id
                          ? "bg-white text-slate-900"
                          : "text-slate-300 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Decorative waveform */}
              <div
                className="mt-8 flex h-24 items-center justify-center gap-1.5"
                aria-hidden="true"
              >
                {BARS.map((height, index) => (
                  <span
                    key={index}
                    className={`w-1.5 rounded-full bg-violet-400 ${
                      isRecording ? "st-bar" : ""
                    }`}
                    style={{
                      height: `${height}%`,
                      opacity: 0.35 + (height / 100) * 0.65,
                      animationDelay: `${(index % 8) * 0.12}s`,
                    }}
                  />
                ))}
              </div>

              <div className="mt-6 flex flex-col items-center text-center">
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`inline-flex items-center gap-3 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-300 ${
                    isRecording
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-violet-500 hover:bg-violet-600"
                  }`}
                >
                  <Icon d={MIC} className="h-5 w-5" />
                  {isRecording ? "Stop recording" : "Start recording"}
                </button>

                <p
                  className="mt-3 text-sm text-slate-400"
                  aria-live="polite"
                >
                  {recordingStatus === "Connecting..."
                    ? "Connecting to the transcription service..."
                    : recordingStatus === "Listening..."
                    ? "Listening — speak into your microphone."
                    : recordingStatus === "Finishing transcript..."
                    ? "Finishing your transcript..."
                    : "Start recording, then speak naturally."}
                </p>

                {recordingError && (
                  <p
                    role="alert"
                    className="mt-3 max-w-md text-sm text-red-300"
                  >
                    {recordingError}
                  </p>
                )}
              </div>
            </div>

            {/* Transcript editor */}
            <div className="p-6 md:p-9">
              <label
                htmlFor="transcript-title"
                className="mb-2 block text-sm font-semibold"
              >
                Title
              </label>

              <input
                id="transcript-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Weekly team meeting"
                className="mb-6 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />

              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="transcript" className="text-sm font-semibold">
                  Transcript
                </label>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleCopy}
                    disabled={!transcript}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Icon d={COPY} className="h-3.5 w-3.5" />
                    {copied ? "Copied" : "Copy"}
                  </button>

                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={!transcript || isRecording}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Icon d={TRASH} className="h-3.5 w-3.5" />
                    Clear
                  </button>
                </div>
              </div>

              <textarea
                id="transcript"
                value={transcript}
                onChange={(event) => setTranscript(event.target.value)}
                placeholder="Your transcript will appear here..."
                rows={8}
                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 text-[15px] leading-7 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />

              <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                <span className="text-sm text-slate-500">
                  {words} {words === 1 ? "word" : "words"}
                </span>

                <button
                  type="button"
                  disabled={!transcript.trim() || isRecording}
                  onClick={handleSave}
                  className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                >
                  Save transcript
                </button>
              </div>
            </div>
          </section>

          {/* History placeholder */}
          <section
            id="history"
            className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-9"
          >
            <h2 className="text-lg font-bold">Recent transcriptions</h2>
            <p className="mt-1 text-sm text-slate-500">
              Saved transcripts will appear here.
            </p>

            <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-violet-600">
                <Icon d={DOC} className="h-6 w-6" />
              </div>

              <h3 className="mt-4 font-semibold">No transcripts yet</h3>
              <p className="mt-1 max-w-xs text-sm text-slate-500">
                Your saved transcriptions will be listed here.
              </p>
            </div>
          </section>

          <footer className="py-8 text-center text-sm text-slate-400">
            SpeechText, built with React and Tailwind CSS
          </footer>
        </div>
      </main>
    </div>
  );
}
