"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { RecordingState } from "@/types/speechAdventure";

interface UseAudioRecorderReturn {
  state: RecordingState;
  audioUrl: string | null;
  /** Raw Blob produced by the last recording. Available after stopRecording. */
  blob: Blob | null;
  /** MIME type of the last recording (e.g. "audio/webm", "audio/mp4"). */
  mimeType: string;
  durationMs: number;
  /** Live elapsed time in ms while recording; resets to 0 after stop. */
  liveRecordingMs: number;
  /** RMS volume level 0–100 while recording; resets to 0 after stop. */
  volumeLevel: number;
  errorMessage: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  playRecording: () => void;
  clearRecording: () => void;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [state, setState] = useState<RecordingState>("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [mimeType, setMimeType] = useState<string>("audio/webm");
  const [durationMs, setDurationMs] = useState(0);
  const [liveRecordingMs, setLiveRecordingMs] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationTickRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.src = "";
      audioElementRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }
    chunksRef.current = [];
  }, []);

  const clearRecording = useCallback(() => {
    cleanup();
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setBlob(null);
    setMimeType("audio/webm");
    setDurationMs(0);
    setLiveRecordingMs(0);
    setVolumeLevel(0);
    setErrorMessage(null);
    setState("idle");
  }, [audioUrl, cleanup]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const startRecording = useCallback(async () => {
    setErrorMessage(null);

    const supported =
      typeof navigator !== "undefined" &&
      typeof navigator.mediaDevices !== "undefined" &&
      typeof MediaRecorder !== "undefined";

    if (!supported) {
      setState("unsupported");
      setErrorMessage("เบราว์เซอร์นี้ไม่รองรับการบันทึกเสียง กรุณาใช้ Chrome หรือ Safari");
      return;
    }

    setState("requesting_permission");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let mimeType = "audio/webm";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/mp4";
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = "";
        }
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      // Optional volume monitoring via Web Audio API
      try {
        const ctx = new AudioContext();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        audioContextRef.current = ctx;
        analyserRef.current = analyser;
      } catch {
        // Volume monitoring is optional — continue without it
      }

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const elapsed = Date.now() - startTimeRef.current;
        setDurationMs(elapsed);
        setLiveRecordingMs(0);
        setVolumeLevel(0);

        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
          audioContextRef.current = null;
        }
        analyserRef.current = null;

        const finalMimeType = recorder.mimeType || "audio/webm";
        const finalBlob = new Blob(chunksRef.current, { type: finalMimeType });
        const url = URL.createObjectURL(finalBlob);

        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        setBlob(finalBlob);
        setMimeType(finalMimeType);
        setAudioUrl(url);

        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        setState("recorded");
      };

      recorder.onerror = () => {
        cleanup();
        setState("error");
        setErrorMessage("เกิดข้อผิดพลาดระหว่างบันทึกเสียง ลองอีกครั้งนะ");
      };

      startTimeRef.current = Date.now();
      durationTickRef.current = 0;

      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        durationTickRef.current = elapsed;
        setLiveRecordingMs(elapsed);

        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteTimeDomainData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const normalized = (dataArray[i] - 128) / 128;
            sum += normalized * normalized;
          }
          const rms = Math.sqrt(sum / dataArray.length);
          setVolumeLevel(Math.min(100, Math.round(rms * 300)));
        }
      }, 100);

      recorder.start(200);
      setState("recording");
    } catch (err: unknown) {
      streamRef.current = null;

      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setState("permission_denied");
        setErrorMessage("ต้องการสิทธิ์ใช้ไมโครโฟนเพื่อฝึกการพูด กรุณาอนุญาตในตั้งค่าเบราว์เซอร์");
      } else if (err instanceof DOMException && err.name === "NotFoundError") {
        setState("error");
        setErrorMessage("ไม่พบไมโครโฟน กรุณาเชื่อมต่อไมโครโฟนแล้วลองใหม่");
      } else {
        setState("error");
        setErrorMessage("ไม่สามารถเริ่มบันทึกเสียงได้ ลองอีกครั้งนะ");
      }
    }
  }, [audioUrl, cleanup]);

  const playRecording = useCallback(() => {
    if (!audioUrl) return;

    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    audioElementRef.current = audio;
    audio.play().catch(() => {
      setErrorMessage("ไม่สามารถเล่นเสียงได้ ลองบันทึกใหม่นะ");
    });
  }, [audioUrl]);

  useEffect(() => {
    return () => {
      cleanup();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    state,
    audioUrl,
    blob,
    mimeType,
    durationMs,
    liveRecordingMs,
    volumeLevel,
    errorMessage,
    startRecording,
    stopRecording,
    playRecording,
    clearRecording,
  };
}
