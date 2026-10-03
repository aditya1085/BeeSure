import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Square,
  Sparkles,
  Volume2,
  Copy,
  Check,
  RotateCcw,
  Upload,
  AlertCircle,
  FileAudio,
  X,
  Play,
  Pause,
  MessageSquare,
  Bot,
} from 'lucide-react';

interface VoiceTranscriberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseTranscript?: (text: string) => void;
}

export const VoiceTranscriberModal: React.FC<VoiceTranscriberModalProps> = ({
  isOpen,
  onClose,
  onUseTranscript,
}) => {
  const [activeTab, setActiveTab] = useState<'record' | 'upload' | 'samples'>('record');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Clean up on unmount or close
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  if (!isOpen) return null;

  // Format seconds as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    setErrorMsg(null);
    setStatusNote(null);
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setRecordingDuration(0);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Determine supported mime type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        setAudioBlob(finalBlob);
        const url = URL.createObjectURL(finalBlob);
        setAudioUrl(url);

        // Stop all audio tracks from stream
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(250); // Slice data every 250ms
      setIsRecording(true);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access failed:', err);
      setErrorMsg('Microphone access denied or unavailable. Please enable microphone permissions in your browser.');
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleTranscribeAudioBlob = async (blob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    setErrorMsg(null);
    setStatusNote('Sending audio to Gemini 3.5 Transcribe...');

    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const res = reader.result as string;
          resolve(res);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(blob);

      const base64Data = await base64Promise;

      const response = await fetch('/api/transcribe-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64Data,
          mimeType: mimeType || blob.type || 'audio/webm',
          prompt: 'Transcribe this voice audio accurately verbatim. Output only the transcript without conversational commentary.',
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data && data.transcript) {
        setTranscript(data.transcript);
        setStatusNote(`Transcribed with model: ${data.modelUsed || 'gemini-3.5-transcribe'}`);
      } else {
        throw new Error(data?.error || 'Empty transcript received');
      }
    } catch (err: any) {
      console.error('Transcription error:', err);
      setErrorMsg(`Transcription failed: ${err.message || 'Please try again.'}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|webm|flac)$/i)) {
      setErrorMsg('Please select a valid audio file (.mp3, .wav, .m4a, .webm).');
      return;
    }

    setAudioBlob(file);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(file));
    setErrorMsg(null);
    setStatusNote(`File loaded: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
  };

  const handleCopyTranscript = () => {
    if (!transcript) return;
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const togglePlayback = () => {
    if (!audioElementRef.current || !audioUrl) return;
    if (isPlayingAudio) {
      audioElementRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioElementRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  // Pre-configured audio samples for demonstration
  const sampleTranscripts = [
    {
      title: 'Apiary Hive Inspection',
      speaker: 'Sita Ram (Beekeeper)',
      text: 'Hive 102 inspection report: Queen is active, laying strong concentric brood patterns. Checked all eight frames in brood chamber, zero signs of Varroa mite or chalkbrood. Moisture level is approximately 17.5 percent.',
    },
    {
      title: 'NABL Honey Lab Purity Verdict',
      speaker: 'Dr. Anita Joshi (Chemist)',
      text: 'Sample CBRTI-2026-B001 test completed. C4 carbon isotope ratio test is negative. Moisture measured at 18.2 percent, HMF is 14 milligrams per kilogram, and pollen count exceeds 28,000 grains. Sample is certified 100 percent pure.',
    },
    {
      title: 'Consumer Marketplace Voice Search',
      speaker: 'Consumer Query',
      text: 'Find raw organic mustard honey from Uttar Pradesh with active blockchain QR verification and lab report.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-amber-500/30 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 p-2 flex items-center justify-center border border-amber-500/40 text-amber-400">
              <Mic className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-amber-400">Audio Transcription</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  gemini-3.5-transcribe
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Speak into microphone or upload audio to transcribe with Gemini AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 px-6 pt-2 shrink-0">
          <button
            onClick={() => setActiveTab('record')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'record'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Record Voice</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'upload'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
          <button
            onClick={() => setActiveTab('samples')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'samples'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Sample Presets</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: Live Record */}
          {activeTab === 'record' && (
            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
              {/* Visualizer & Waveform Animation */}
              <div className="relative flex items-center justify-center">
                {isRecording && (
                  <div className="absolute w-28 h-28 rounded-full bg-amber-500/20 animate-ping" />
                )}
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isTranscribing}
                  className={`relative z-10 w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-xl transition-all duration-300 ${
                    isRecording
                      ? 'bg-red-500 text-white hover:bg-red-600 scale-105'
                      : 'bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 hover:from-amber-400 hover:to-amber-300 hover:scale-105'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <Square className="w-7 h-7 fill-white" />
                      <span className="text-[10px] font-bold mt-1 uppercase">Stop</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-7 h-7" />
                      <span className="text-[10px] font-black mt-1 uppercase">Record</span>
                    </>
                  )}
                </button>
              </div>

              {/* Status and Timer */}
              <div className="text-center space-y-1">
                <div className="text-2xl font-mono font-black text-slate-900 dark:text-white">
                  {formatTime(recordingDuration)}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isRecording
                    ? 'Listening... Click STOP when finished speaking.'
                    : audioBlob
                    ? 'Recording saved. Ready to transcribe.'
                    : 'Click the microphone button to start speaking.'}
                </p>
              </div>

              {/* Live Audio Waves graphic while recording */}
              {isRecording && (
                <div className="flex items-center gap-1.5 h-8">
                  {[40, 70, 30, 90, 60, 100, 50, 80, 45, 95, 60, 35].map((height, i) => (
                    <div
                      key={i}
                      className="w-1 bg-amber-500 rounded-full animate-pulse"
                      style={{
                        height: `${height}%`,
                        animationDuration: `${0.4 + (i % 5) * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Playback preview if audio recorded */}
              {audioUrl && !isRecording && (
                <div className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <FileAudio className="w-4 h-4 text-amber-500" />
                    <span>Recorded Snippet ({formatTime(recordingDuration)})</span>
                  </div>
                  <button
                    onClick={togglePlayback}
                    className="p-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-1.5 text-xs font-bold transition"
                  >
                    {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isPlayingAudio ? 'Pause' : 'Play Preview'}</span>
                  </button>
                  <audio
                    ref={audioElementRef}
                    src={audioUrl}
                    onEnded={() => setIsPlayingAudio(false)}
                    className="hidden"
                  />
                </div>
              )}

              {/* Transcribe Action */}
              {audioBlob && !isRecording && (
                <button
                  type="button"
                  onClick={() => handleTranscribeAudioBlob(audioBlob, audioBlob.type || 'audio/webm')}
                  disabled={isTranscribing}
                  className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
                >
                  {isTranscribing ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>Transcribing with Gemini 3.5 Transcribe...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Transcribe Audio with Gemini 3.5</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* TAB 2: Upload File */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-amber-500/40 hover:border-amber-500 rounded-3xl cursor-pointer bg-slate-50 dark:bg-slate-800/40 transition group">
                <FileAudio className="w-10 h-10 text-amber-500 group-hover:scale-110 transition mb-3" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Click to select audio file
                </span>
                <span className="text-[11px] text-slate-500 mt-1">
                  Supports MP3, WAV, WEBM, M4A, OGG (Max 25MB)
                </span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {audioBlob && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/50 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-900 dark:text-amber-300">File Selected:</span>
                    <span className="text-slate-600 dark:text-slate-400 font-mono">
                      {(audioBlob.size / 1024).toFixed(1)} KB
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTranscribeAudioBlob(audioBlob, audioBlob.type)}
                    disabled={isTranscribing}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
                  >
                    {isTranscribing ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin" />
                        <span>Transcribing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Transcribe with gemini-3.5-transcribe</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Sample Presets */}
          {activeTab === 'samples' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click any pre-recorded scenario to simulate immediate audio transcription:
              </p>
              <div className="space-y-2">
                {sampleTranscripts.map((sample, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setTranscript(sample.text);
                      setStatusNote(`Loaded sample preset (${sample.title})`);
                    }}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/5 cursor-pointer transition space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {sample.title}
                      </span>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold px-2 py-0.5 rounded-full bg-amber-500/10">
                        {sample.speaker}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic line-clamp-2">
                      "{sample.text}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transcript Result Area */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Transcribed Text Output</span>
              </label>

              {statusNote && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                  {statusNote}
                </span>
              )}
            </div>

            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Your transcribed text will appear here. You can edit, copy, or send it to the Bee Assistant."
              rows={4}
              className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 resize-none font-sans"
            />

            {/* Transcript Actions */}
            {transcript && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="text-[11px] text-slate-500">
                  {transcript.trim().split(/\s+/).filter(Boolean).length} words • {transcript.length} chars
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyTranscript}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>

                  {onUseTranscript && (
                    <button
                      type="button"
                      onClick={() => {
                        onUseTranscript(transcript);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>Use in Assistant</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
