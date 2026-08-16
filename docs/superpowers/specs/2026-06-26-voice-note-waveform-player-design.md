# Design Spec: Premium Waveform Voice Note Player

**Date:** 2026-06-26  
**Status:** Approved  
**Topic:** Redesign voice note attachment UI to match the conversations style with a custom waveform player.

---

## 1. Overview
We are replacing the native HTML5 audio controls for voice notes in the redesigned conversations panel with a premium WhatsApp/Telegram-style waveform audio player. 

Key features:
- **Real Waveform Visualization:** Peak amplitude analysis of the audio data using the Web Audio API (`AudioContext`).
- **Interactive Waveform Timeline:** Click-to-seek playback progress.
- **Speed Control:** Playback rate selection (1x, 1.5x, 2x).
- **Single Playback Sync:** Global event-driven pause for other active players.
- **Resource Management:** Automatic context closing and object URL revocation to prevent leaks.

---

## 2. Component Design & Architecture

### Component: `AttachmentCard` (Audio mode)
When `isAudio` is detected, `AttachmentCard` will render the custom waveform player instead of a generic file attachment card.

#### State Model
```typescript
const [audioUrl, setAudioUrl] = useState<string | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(false);
const [isPlaying, setIsPlaying] = useState(false);
const [currentTime, setCurrentTime] = useState(0);
const [duration, setDuration] = useState(0);
const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.5 | 2>(1);
const [peaks, setPeaks] = useState<number[]>([]);
```

#### Audio Ref & Audio Element
We will use a hidden HTML5 `<audio>` element:
```tsx
const audioRef = useRef<HTMLAudioElement | null>(null);
```

---

## 3. Core Logic & Implementation

### A. Web Audio API Peak Analysis (Real Waveform)
On file load, we fetch the audio Blob and decode it to extract volume amplitudes:

```typescript
const response = await apiClient.get(`/files/${fileId}/download`, {
  responseType: "blob",
});
const blob = response.data;

const arrayBuffer = await blob.arrayBuffer();
const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

try {
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  const channelData = audioBuffer.getChannelData(0);
  
  // Downsample to 28 bars
  const barCount = 28;
  const chunkSize = Math.floor(channelData.length / barCount);
  const calculatedPeaks: number[] = [];

  for (let i = 0; i < barCount; i++) {
    const start = i * chunkSize;
    const end = start + chunkSize;
    let max = 0;
    for (let j = start; j < end; j++) {
      const val = Math.abs(channelData[j]);
      if (val > max) max = val;
    }
    // Normalize height between 15% and 100%
    const heightPercent = Math.round(15 + max * 85);
    calculatedPeaks.push(heightPercent);
  }
  setPeaks(calculatedPeaks);
} catch (err) {
  console.error("Failed to decode audio context, using fallback peaks:", err);
  // Fallback peaks (mock waveform)
  setPeaks([25, 40, 15, 60, 80, 45, 30, 70, 90, 50, 20, 35, 65, 85, 40, 30, 55, 75, 45, 25, 60, 80, 50, 30, 45, 65, 20, 15]);
} finally {
  await audioCtx.close(); // Clean up context to prevent browser limits
}
```

### B. Interactive Waveform Seek
Clicking the waveform container seeks the audio:
```typescript
const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
  if (!audioRef.current || !duration) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const percentage = clickX / rect.width;
  audioRef.current.currentTime = percentage * duration;
};
```

### C. Playback Speed Control
Clicking the speed badge cycles speed rates:
```typescript
const toggleSpeed = () => {
  let nextSpeed: 1 | 1.5 | 2 = 1;
  if (playbackSpeed === 1) nextSpeed = 1.5;
  else if (playbackSpeed === 1.5) nextSpeed = 2;
  
  setPlaybackSpeed(nextSpeed);
  if (audioRef.current) {
    audioRef.current.playbackRate = nextSpeed;
  }
};
```

### D. Single Active Audio Sync
Broadcast a custom window event to pause all other running audios:
```typescript
useEffect(() => {
  const handleOtherPlay = (e: Event) => {
    const customEvent = e as CustomEvent;
    if (customEvent.detail?.fileId !== fileId && audioRef.current) {
      audioRef.current.pause();
    }
  };

  window.addEventListener("voice-play", handleOtherPlay);
  return () => {
    window.removeEventListener("voice-play", handleOtherPlay);
  };
}, [fileId]);

const playAudio = () => {
  window.dispatchEvent(new CustomEvent("voice-play", { detail: { fileId } }));
  audioRef.current?.play();
};
```

---

## 4. UI Layout & Style Specifications

The design adopts a clean layout inside message bubbles using Tailwind CSS:
- Play/Pause Circle: `h-8 w-8 rounded-full flex items-center justify-center shrink-0`
- Waveform Container: `flex items-end gap-[1.5px] h-7 px-1 flex-1 cursor-pointer`
- Duration & Speed row: `flex items-center justify-between text-[10px] opacity-80 mt-1`
- Colors:
  * **Own bubble:** Faded elements use `bg-white/20`, active bars use `bg-white`, buttons/text are white.
  * **Other bubble:** Faded elements use `bg-slate-200`, active bars use `bg-primary`, buttons/text are primary/slate.

---

## 5. Verification Plan
- **Mock Tests:** Verify `AttachmentCard` renders the custom audio element without exceptions when supplied with dummy audio files.
- **Manual Verification:** Play multiple voice notes in succession to ensure auto-pausing behavior. Seek forward and backward by clicking on various parts of the waveform. Verify that speed controls modify audio speed accordingly.
