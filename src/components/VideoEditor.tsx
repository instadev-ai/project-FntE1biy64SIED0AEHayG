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
  ZoomOut
} from "lucide-react";

const VideoEditor = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [zoom, setZoom] = useState(1);

  // Video configuration
  const fps = 30;
  const durationInFrames = 30 * 10; // 10 seconds
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
      return Math.min(Math.max(newZoom, 0.5), 3); // Limit zoom between 0.5x and 3x
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Preview Window */}
        <Card className="p-4 bg-card">
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <Player
              component={() => <div className="w-full h-full bg-black" />}
              durationInFrames={durationInFrames}
              fps={fps}
              compositionWidth={compositionWidth}
              compositionHeight={compositionHeight}
              playing={isPlaying}
              onFrame={handleTimeUpdate}
            />
          </div>
        </Card>

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
            {/* Timeline tracks will be added here */}
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

              {/* Example tracks */}
              {Array.from({ length: 3 }).map((_, i) => (
                <div 
                  key={i}
                  className="h-20 border-b border-muted-foreground/20 flex items-center p-2"
                >
                  <div className="w-full h-16 rounded bg-muted/20" />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VideoEditor;