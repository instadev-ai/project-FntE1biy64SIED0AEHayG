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
  Plus,
  Trash2,
  GripVertical
} from "lucide-react";
import MediaLibrary, { type MediaAsset } from "./MediaLibrary";

interface Track {
  id: string;
  mediaAsset: MediaAsset;
  startTime: number; // in seconds
  endTime: number; // in seconds
  selected: boolean;
}

const VideoEditor = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<MediaAsset | null>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [isDraggingClip, setIsDraggingClip] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Video configuration
  const fps = 30;
  const durationInFrames = 30 * 30; // 30 seconds timeline
  const pixelsPerSecond = 200; // Increased for better precision
  const snapThreshold = 10; // pixels

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
      setCurrentTime(newTime);
      
      // Update video source based on current time
      const currentTrack = tracks.find(track => 
        newTime >= track.startTime && newTime <= track.endTime
      );
      
      if (currentTrack && selectedVideo?.url !== currentTrack.mediaAsset.url) {
        setSelectedVideo(currentTrack.mediaAsset);
        if (videoRef.current) {
          videoRef.current.currentTime = newTime - currentTrack.startTime;
        }
      }
    }
  }, [isDraggingPlayhead, tracks, selectedVideo]);

  const findNearestSnapPoint = (time: number): number => {
    const snapPoints: number[] = [];
    
    // Add track start and end points
    tracks.forEach(track => {
      snapPoints.push(track.startTime);
      snapPoints.push(track.endTime);
    });
    
    // Add current playhead position
    snapPoints.push(currentTime);
    
    // Find nearest snap point
    const pixelTime = time * pixelsPerSecond;
    let nearestPoint = time;
    let minDistance = snapThreshold;
    
    snapPoints.forEach(point => {
      const pointPixels = point * pixelsPerSecond;
      const distance = Math.abs(pixelTime - pointPixels);
      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = point;
      }
    });
    
    return nearestPoint;
  };

  const handleMediaSelect = (asset: MediaAsset) => {
    const videoDuration = parseFloat(asset.duration);
    const newTrack: Track = {
      id: Date.now().toString(),
      mediaAsset: asset,
      startTime: currentTime,
      endTime: currentTime + videoDuration,
      selected: false
    };
    
    // Check for overlaps and adjust position
    let adjustedStartTime = currentTime;
    let hasOverlap;
    
    do {
      hasOverlap = false;
      tracks.forEach(track => {
        if (
          (adjustedStartTime >= track.startTime && adjustedStartTime <= track.endTime) ||
          (adjustedStartTime + videoDuration >= track.startTime && adjustedStartTime + videoDuration <= track.endTime)
        ) {
          adjustedStartTime = track.endTime;
          hasOverlap = true;
        }
      });
    } while (hasOverlap);
    
    newTrack.startTime = adjustedStartTime;
    newTrack.endTime = adjustedStartTime + videoDuration;
    
    setTracks(prev => [...prev, newTrack]);
    setSelectedVideo(asset);
  };

  const seekTo = (time: number) => {
    const newTime = Math.max(0, Math.min(time, durationInFrames / fps));
    setCurrentTime(newTime);
    
    // Find the appropriate track for this time
    const currentTrack = tracks.find(track => 
      newTime >= track.startTime && newTime <= track.endTime
    );
    
    if (currentTrack) {
      setSelectedVideo(currentTrack.mediaAsset);
      if (videoRef.current) {
        videoRef.current.currentTime = newTime - currentTrack.startTime;
      }
    }
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current || isDraggingClip) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollLeft = timelineRef.current.scrollLeft;
    const x = (e.clientX - rect.left + scrollLeft) / zoom;
    const newTime = x / pixelsPerSecond;
    
    seekTo(findNearestSnapPoint(newTime));
  };

  const handleClipDragStart = (e: React.MouseEvent, trackId: string) => {
    setIsDraggingClip(true);
    setSelectedTrackId(trackId);
    setDragStartX(e.clientX);
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      setDragStartTime(track.startTime);
    }
  };

  const handleClipDrag = (e: React.MouseEvent) => {
    if (!isDraggingClip || !selectedTrackId || !timelineRef.current) return;
    
    const deltaX = (e.clientX - dragStartX) / zoom;
    const deltaTime = deltaX / pixelsPerSecond;
    const track = tracks.find(t => t.id === selectedTrackId);
    
    if (track) {
      const newStartTime = findNearestSnapPoint(dragStartTime + deltaTime);
      const duration = track.endTime - track.startTime;
      
      setTracks(prev => prev.map(t => 
        t.id === selectedTrackId
          ? {
              ...t,
              startTime: newStartTime,
              endTime: newStartTime + duration
            }
          : t
      ));
    }
  };

  const handleClipDragEnd = () => {
    setIsDraggingClip(false);
    setSelectedTrackId(null);
  };

  const deleteTrack = (trackId: string) => {
    setTracks(prev => prev.filter(t => t.id !== trackId));
  };

  useEffect(() => {
    const handleMouseUp = () => {
      if (isDraggingClip) {
        handleClipDragEnd();
      }
      if (isDraggingPlayhead) {
        setIsDraggingPlayhead(false);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingClip) {
        handleClipDrag(e as unknown as React.MouseEvent);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDraggingClip, isDraggingPlayhead]);

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
              onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setZoom(z => Math.min(3, z + 0.2))}
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
                className="absolute top-0 bottom-0 w-0.5 bg-primary z-20 cursor-ew-resize"
                style={{ 
                  left: `${currentTime * pixelsPerSecond}px`,
                  transform: `translateX(-50%)`,
                }}
              >
                <div className="w-3 h-3 bg-primary rounded-full -translate-x-1/2" />
              </div>

              {/* Time markers */}
              <div className="h-8 border-b flex sticky top-0 bg-background z-10">
                {Array.from({ length: Math.ceil(durationInFrames / fps) }).map((_, i) => (
                  <div 
                    key={i} 
                    className="flex-none border-r border-muted-foreground/20 text-xs text-muted-foreground p-2"
                    style={{ width: `${pixelsPerSecond}px` }}
                  >
                    {i}s
                  </div>
                ))}
              </div>

              {/* Video Tracks */}
              {tracks.map((track) => (
                <div 
                  key={track.id}
                  className="h-20 border-b border-muted-foreground/20 relative group"
                >
                  <div 
                    className={`absolute h-16 top-2 rounded-md transition-colors ${
                      track.selected ? 'bg-primary/30' : 'bg-primary/20'
                    } hover:bg-primary/40 cursor-move group flex items-center`}
                    style={{
                      left: `${track.startTime * pixelsPerSecond}px`,
                      width: `${(track.endTime - track.startTime) * pixelsPerSecond}px`
                    }}
                    onMouseDown={(e) => handleClipDragStart(e, track.id)}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/50 rounded-l cursor-ew-resize" />
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary/50 rounded-r cursor-ew-resize" />
                    
                    <GripVertical className="h-4 w-4 mx-2 text-primary/50" />
                    <span className="text-xs truncate flex-1 px-2">
                      {track.mediaAsset.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity mr-2"
                      onClick={() => deleteTrack(track.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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