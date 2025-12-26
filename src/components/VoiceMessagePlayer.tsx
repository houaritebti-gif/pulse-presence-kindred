import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";

interface VoiceMessagePlayerProps {
  audioUrl: string;
  isOwn?: boolean;
}

const VoiceMessagePlayer = ({ audioUrl, isOwn = false }: VoiceMessagePlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
    });

    audio.addEventListener("timeupdate", () => {
      setProgress((audio.currentTime / audio.duration) * 100);
    });

    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      setProgress(0);
    });

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = clickPosition * audioRef.current.duration;
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center gap-3 min-w-[180px] px-3 py-2 rounded-2xl ${
      isOwn ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground"
    }`}>
      <button
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
          isOwn 
            ? "bg-primary-foreground/20 hover:bg-primary-foreground/30" 
            : "bg-primary/20 hover:bg-primary/30"
        }`}
      >
        {isPlaying ? (
          <Pause className={`w-4 h-4 ${isOwn ? "text-primary-foreground" : "text-primary"}`} />
        ) : (
          <Play className={`w-4 h-4 ml-0.5 ${isOwn ? "text-primary-foreground" : "text-primary"}`} />
        )}
      </button>

      <div className="flex-1 flex flex-col gap-1">
        {/* Progress bar */}
        <div 
          className={`h-1.5 rounded-full cursor-pointer ${
            isOwn ? "bg-primary-foreground/30" : "bg-muted"
          }`}
          onClick={handleProgressClick}
        >
          <div 
            className={`h-full rounded-full transition-all ${
              isOwn ? "bg-primary-foreground" : "bg-primary"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Duration */}
        <span className={`text-[10px] ${
          isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
        }`}>
          {formatTime(audioRef.current?.currentTime || 0)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};

export default VoiceMessagePlayer;
