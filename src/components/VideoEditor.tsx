import { Player } from "@remotion/player";
import { useCallback, useState } from "react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
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
  const [zoom, setZoom] = useState(1);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<MediaAsset | null>(null);

  // Video configuration
  const fps = 30;
  const durationInFrames = 30 * 30; // 30 seconds timeline
  const compositionWidth = 1920;
  const compositionHeight = 1080;

  const togglePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleTimeUpdate = useCallback((frame: number) => {
    setCurrentTime(frame / fps);
  }, []);

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

  const MyComposition = () => {
    return (
      <div className="w-full h-full bg-black relative">
        {selectedVideo && (
          <video
            src={selectedVideo.url}
            className="w-full h-full object-contain"
            autoPlay={isPlaying}
            loop
          />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Preview Window */}
          <Card className="col-span-2 p-4 bg-card">
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <Player
                component={MyComposition}
                durationInFrames={durationInFrames}
                fps={fps}
                compositionWidth={compositionWidth}
                compositionHeight={compositionHeight}
                playing={isPlaying}
                onFrame={handleTimeUpdate}
              />
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
              onClick={() => setCurrentTime(0)}
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
              onClick={() => setCurrentTime(durationInFrames / fps)}
            >
              <SkipForward className="h-4 w-4" />
            </Button>

            <div className="flex-1">
              <Slider
                value={[currentTime]}
                min={0}
                max={durationInFrames / fps}
                step={1 / fps}
                onValueChange={([value]) => setCurrentTime(value)}
              />
            </div>

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
            className="h-full overflow-x-auto"
            style={{ 
              transform: `scale(${zoom})`,
              transformOrigin: "left top"
            }}
          >
            <div className="min-w-[2000px] h-full bg-muted/20 rounded-lg">
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
                    paddingLeft: `${track.startTime * 100}px`
                  }}
                >
                  <div 
                    className="h-16 rounded bg-primary/20 flex items-center px-2"
                    style={{
                      width: `${parseFloat(track.mediaAsset.duration) * 100}px`
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