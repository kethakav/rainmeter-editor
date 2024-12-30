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

  const handleExport = async (metadata: { name: string; author: string; version: string; description: string }) => {
    const success = await handleCreateDirectory(metadata);

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

  return (
    <TooltipProvider>
      <div className="h-16 bg-secondary border-gray-200 flex items-center justify-between px-6">
        <div className="text-xl text-secondary-foreground font-semibold">
          Rainmeter Editor <Badge variant="outline">v{version}</Badge>
        </div>
        <div>
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