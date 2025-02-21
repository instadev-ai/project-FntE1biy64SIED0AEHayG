import { Player } from "@remotion/player";
import { useCallback, useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  ZoomIn,
  ZoomOut,
  Plus
} from "lucide-react";
import MediaLibrary, { type MediaAsset } from "./MediaLibrary";

interface Track {
  id: string;
  mediaAsset: MediaAsset;
  startTime: number;
}

const VideoEditor = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<MediaAsset | null>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Video configuration
  const fps = 30;
  const durationInFrames = 30 * 30; // 30 seconds timeline
  const compositionWidth = 1920;
  const compositionHeight = 1080;
  const pixelsPerSecond = 100; // Width in pixels for one second in timeline

  const togglePlayPause = useCallback(() => {
    setIsPlaying(prev => {
      const newIsPlaying = !prev;
      if (videoRef.current) {
        if (newIsPlaying) {
          videoRef.current.play();
        } else {
          videoRef.current.pause();
        }
      }
      return newIsPlaying;
    });
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (!isDraggingPlayhead && videoRef.current) {
      const newTime = videoRef.current.currentTime;
      const newFrame = Math.round(newTime * fps);
      setCurrentTime(newTime);
      setCurrentFrame(newFrame);
    }
  }, [isDraggingPlayhead, fps]);

  const handleZoom = (direction: "in" | "out") => {
    setZoom(prev => {
      const newZoom = direction === "in" ? prev * 1.2 : prev / 1.2;
      return Math.min(Math.max(newZoom, 0.5), 3);
    });
  };

  const handleMediaSelect = (asset: MediaAsset) => {
    setSelectedVideo(asset);
    const newTrack: Track = {
      id: Date.now().toString(),
      mediaAsset: asset,
      startTime: currentTime
    };
    setTracks(prev => [...prev, newTrack]);
  };

  const seekTo = (time: number) => {
    const newTime = Math.max(0, Math.min(time, durationInFrames / fps));
    setCurrentTime(newTime);
    setCurrentFrame(Math.round(newTime * fps));
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollLeft = timelineRef.current.scrollLeft;
    const x = (e.clientX - rect.left + scrollLeft) / zoom;
    const newTime = x / pixelsPerSecond;
    seekTo(newTime);
  };

  const handlePlayheadDragStart = () => {
    setIsDraggingPlayhead(true);
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const handlePlayheadDragEnd = () => {
    setIsDraggingPlayhead(false);
  };

  const handlePlayheadDrag = (e: React.MouseEvent) => {
    if (isDraggingPlayhead && timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const scrollLeft = timelineRef.current.scrollLeft;
      const x = (e.clientX - rect.left + scrollLeft) / zoom;
      const newTime = x / pixelsPerSecond;
      seekTo(newTime);
    }
  };

  useEffect(() => {
    const handleMouseUp = () => {
      if (isDraggingPlayhead) {
        handlePlayheadDragEnd();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingPlayhead) {
        handlePlayheadDrag(e as unknown as React.MouseEvent);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDraggingPlayhead]);

  // Auto-scroll timeline to keep playhead visible
  useEffect(() => {
    if (!timelineRef.current || isDraggingPlayhead) return;

    const timelineEl = timelineRef.current;
    const playheadPosition = currentTime * pixelsPerSecond * zoom;
    const timelineRect = timelineEl.getBoundingClientRect();
    const scrollLeft = timelineEl.scrollLeft;
    const viewportWidth = timelineRect.width;
    const buffer = viewportWidth * 0.2; // 20% buffer zone

    if (playheadPosition < scrollLeft + buffer) {
      timelineEl.scrollLeft = Math.max(0, playheadPosition - buffer);
    } else if (playheadPosition > scrollLeft + viewportWidth - buffer) {
      timelineEl.scrollLeft = playheadPosition - viewportWidth + buffer;
    }
  }, [currentTime, pixelsPerSecond, zoom, isDraggingPlayhead]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Preview Window */}
          <Card className="col-span-2 p-4 bg-card">
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              {selectedVideo && (
                <video
                  ref={videoRef}
                  src={selectedVideo.url}
                  className="w-full h-full object-contain"
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                />
              )}
            </div>
          </Card>

          {/* Media Library */}
          <div className="col-span-1">
            <MediaLibrary onSelectMedia={handleMediaSelect} />
          </div>
        </div>

        {/* Controls */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => seekTo(0)}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={togglePlayPause}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => seekTo(durationInFrames / fps)}
            >
              <SkipForward className="h-4 w-4" />
            </Button>

            <div className="text-sm text-muted-foreground">
              {currentTime.toFixed(1)}s
            </div>

            <div className="flex-1" />

            <Button
              variant="outline"
              size="icon"
              onClick={() => handleZoom("out")}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => handleZoom("in")}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* Timeline */}
        <Card className="p-4 h-[300px] overflow-hidden">
          <div 
            ref={timelineRef}
            className="h-full overflow-x-auto relative"
            onClick={handleTimelineClick}
            style={{ 
              transform: `scale(${zoom})`,
              transformOrigin: "left top"
            }}
          >
            <div className="min-w-[2000px] h-full bg-muted/20 rounded-lg">
              {/* Playhead */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-primary z-10 cursor-ew-resize"
                style={{ 
                  left: `${currentTime * pixelsPerSecond}px`,
                  transform: `translateX(-50%)`,
                }}
                onMouseDown={handlePlayheadDragStart}
              >
                <div className="w-3 h-3 bg-primary rounded-full -translate-x-1/2" />
              </div>

              {/* Time markers */}
              <div className="h-8 border-b flex">
                {Array.from({ length: Math.ceil(durationInFrames / fps) }).map((_, i) => (
                  <div 
                    key={i} 
                    className="flex-none w-[100px] border-r border-muted-foreground/20 text-xs text-muted-foreground p-2"
                  >
                    {i}s
                  </div>
                ))}
              </div>

              {/* Video Tracks */}
              {tracks.map((track) => (
                <div 
                  key={track.id}
                  className="h-20 border-b border-muted-foreground/20 flex items-center p-2"
                  style={{
                    paddingLeft: `${track.startTime * pixelsPerSecond}px`
                  }}
                >
                  <div 
                    className="h-16 rounded bg-primary/20 flex items-center px-2"
                    style={{
                      width: `${parseFloat(track.mediaAsset.duration) * pixelsPerSecond}px`
                    }}
                  >
                    <span className="text-xs truncate">
                      {track.mediaAsset.name}
                    </span>
                  </div>
                </div>
              ))}

              {/* Empty track */}
              <div className="h-20 border-b border-muted-foreground/20 flex items-center p-2">
                <div className="w-full h-16 rounded bg-muted/20 flex items-center justify-center">
                  <Button variant="ghost" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Track
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VideoEditor;