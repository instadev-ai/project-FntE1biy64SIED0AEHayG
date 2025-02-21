import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MediaAsset {
  id: string;
  name: string;
  duration: string;
  url: string;
}

const mediaAssets: MediaAsset[] = [
  {
    id: "1",
    name: "Sample 5s",
    duration: "5s",
    url: "https://download.samplelib.com/mp4/sample-5s.mp4"
  },
  {
    id: "2",
    name: "Sample 10s",
    duration: "10s",
    url: "https://download.samplelib.com/mp4/sample-10s.mp4"
  }
];

interface MediaLibraryProps {
  onSelectMedia: (asset: MediaAsset) => void;
}

const MediaLibrary = ({ onSelectMedia }: MediaLibraryProps) => {
  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">Media Library</h2>
      <div className="grid grid-cols-2 gap-4">
        {mediaAssets.map((asset) => (
          <Card 
            key={asset.id} 
            className="p-3 cursor-pointer hover:bg-accent transition-colors"
            onClick={() => onSelectMedia(asset)}
          >
            <video 
              src={asset.url} 
              className="w-full h-32 object-cover rounded-md bg-black mb-2"
            />
            <div className="text-sm font-medium">{asset.name}</div>
            <div className="text-xs text-muted-foreground">{asset.duration}</div>
          </Card>
        ))}
      </div>
    </Card>
  );
};

export default MediaLibrary;
export type { MediaAsset };