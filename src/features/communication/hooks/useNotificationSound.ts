"use client";

import { useCallback, useRef } from "react";

const SOUND_URL = "/sounds/message-notification.mp3";
const MUTE_KEY = "moazez_notification_muted";

function isMuted(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(MUTE_KEY) === "true";
}

export function setNotificationMuted(muted: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MUTE_KEY, String(muted));
}

export function getNotificationMuted(): boolean {
  return isMuted();
}

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(() => {
    if (isMuted()) return;
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(SOUND_URL);
        audioRef.current.volume = 0.5;
      }
      audioRef.current.currentTime = 0;
      void audioRef.current.play().catch(() => {
        // Browser blocked autoplay — ignore silently
      });
    } catch {
      // Audio not supported
    }
  }, []);

  return { play };
}
