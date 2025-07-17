import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { handleCreateDirectory } from '@/services/ExportToINI';
import { useToast } from "@/hooks/use-toast"
import ExportModal from './ExportModal'
import { checkForAppUpdates } from '@/services/CheckForAppUpdates';
import { version as appVersion } from '../../package.json';
import { Badge } from './ui/badge';
import { FaBug, FaDiscord } from 'react-icons/fa';
import { open } from '@tauri-apps/plugin-shell';

const Topbar: React.FC = () => {
  const [version, setVersion] = useState('1.0.0'); // Add version state
  const v = appVersion;

  useEffect(() => {
    checkForAppUpdates(false);
    // Fetch version number if needed
    // setVersion(fetchVersionNumber());
    setVersion(v);
  }, []);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const { toast } = useToast();

  const handleExport = async (metadata: { name: string; author: string; version: string; description: string},  allowScrollResize: boolean ) => {
    const success = await handleCreateDirectory(metadata, allowScrollResize);

    if (success) {
        toast({
            title: "Export Successful",
            description: "Your Rainmeter skin has been exported successfully.",
        });
    } else {
        toast({
            title: "Export Failed",
            description: "There was an error exporting your Rainmeter skin. Please try again. Most likely the skin already exists.",
            variant: "destructive",
        });
    }

    return success;
  };

  // const handleRefresh = async () => {
  //   // await Window
  //   // await Webview.reload();
  //   // await getCurrentWindow().refr
  //   // await getCurrentWebview().;
  // };

  return (
    <TooltipProvider>
      <div className="h-16 z-2 bg-secondary border-gray-200 flex items-center justify-between px-6">
        <div className="text-xl text-secondary-foreground font-semibold">
          Rainmeter Editor <Badge variant="outline">v{version}</Badge>
        </div>
        <div className="flex items-center space-x-2">
          {/* <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline"
                onClick={handleRefresh} // Trigger refresh action
                className="hover:text-primary"
              >
                <FaSync />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Refresh</p>
            </TooltipContent>
          </Tooltip> */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline"
                onClick={() => open("https://discord.gg/tzY82KkS4H")} 
                className="hover:text-primary"
              >
                <FaDiscord />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Join our Discord</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline"
                onClick={() => open("https://github.com/kethakav/rainmeter-editor/issues")} 
                
                className="hover:text-destructive"
              >
                <FaBug />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Report a Bug</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="default" onClick={() => setIsExportModalOpen(true)}>
                Export
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export Skin</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <ExportModal 
        onExport={handleExport} 
        open={isExportModalOpen} 
        onOpenChange={setIsExportModalOpen}
      />
    </TooltipProvider>
  )
}

export default Topbar;