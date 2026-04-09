import { useEffect, useRef, useState } from 'react';
import { Loader2, Mic, Square, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { getSupportedRecordingMimeType } from '../utils/voice';

export default function VoiceButton({
  onRecordingComplete,
  isProcessing = false,
  isSpeaking = false,
  disabled = false,
}) {
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const [isRecording, setIsRecording] = useState(false);

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    return () => {
      if (recorderRef.current?.state && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
      stopTracks();
    };
  }, []);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Microphone access is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedRecordingMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.addEventListener('dataavailable', (event) => {
        if (event.data?.size) {
          chunksRef.current.push(event.data);
        }
      });

      recorder.addEventListener(
        'stop',
        async () => {
          const blob = new Blob(chunksRef.current, {
            type: recorder.mimeType || mimeType || 'audio/webm',
          });
          chunksRef.current = [];
          stopTracks();

          if (!blob.size) {
            toast.error('No voice detected. Please try again.');
            return;
          }

          await onRecordingComplete?.(blob);
        },
        { once: true }
      );

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      stopTracks();
      setIsRecording(false);
      toast.error(error?.message || 'Unable to access the microphone.');
    }
  };

  const stopRecording = () => {
    if (!recorderRef.current || recorderRef.current.state === 'inactive') return;
    setIsRecording(false);
    recorderRef.current.stop();
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
      return;
    }
    if (disabled || isProcessing) return;
    void startRecording();
  };

  const Icon = isProcessing ? Loader2 : isRecording ? Square : isSpeaking ? Volume2 : Mic;
  const label = isRecording ? 'Listening...' : isProcessing ? 'Processing...' : isSpeaking ? 'Speaking' : 'Voice';

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={disabled || isProcessing}
      whileTap={{ scale: 0.97 }}
      className={clsx(
        'group inline-flex h-11 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-all duration-300 backdrop-blur-lg',
        isRecording
          ? 'animate-voice-ring border-rose-400/40 bg-rose-500/15 text-rose-100 shadow-[0_0_0_1px_rgba(251,113,133,0.16),0_12px_30px_rgba(244,63,94,0.18)]'
          : 'border-slate-200 bg-white/85 text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:border-blue-300/40 hover:shadow-[0_14px_30px_rgba(59,130,246,0.14)] dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10',
        (disabled || isProcessing) && !isRecording ? 'cursor-not-allowed opacity-80' : ''
      )}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
    >
      {isRecording && <span className="h-2 w-2 rounded-full bg-rose-300 shadow-[0_0_18px_rgba(253,164,175,0.8)]" />}
      <Icon className={clsx('h-4 w-4', isProcessing ? 'animate-spin' : '')} />
      <span className="hidden sm:inline">{label}</span>
    </motion.button>
  );
}
