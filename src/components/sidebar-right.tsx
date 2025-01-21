import { useEffect, useState } from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { checkForAppUpdates } from "@/services/CheckForAppUpdates";
import { useToast } from "@/hooks/use-toast";
import { handleCreateDirectory } from "@/services/ExportToINI";
import { version as appVersion } from '../../package.json';
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Button } from "./ui/button";
import { Bug } from 'lucide-react';
import { FaDiscord, FaReddit } from "react-icons/fa";
import { useLayerContext } from "@/context/LayerContext";
import ExportModal from "./ExportModal";
import SkinProperties from "./PropertiesSidebar/SkinProperties";
import TextLayerProperties from "./PropertiesSidebar/TextProperties";
import ImageLayerProperties from "./PropertiesSidebar/ImageProperties";
import RotatorLayerProperties from "./PropertiesSidebar/RotatorProperties";
import BarLayerProperties from "./PropertiesSidebar/BarProperties";
import { ModeToggle } from "./mode-toggle";


export function SidebarRight({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
    const { selectedLayer } = useLayerContext();
    const selectedLayerId = selectedLayer?.id;
    const [version, setVersion] = useState('1.0.0'); // Add version state
  const v = appVersion;

  useEffect(() => {
    checkForAppUpdates(false);
    console.log(version);
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
  return (
    <Sidebar
      collapsible="none"
      className="sticky hidden lg:flex top-0 h-svh border-l"
      {...props}
    >
      <SidebarHeader className="h-fit flex flex-row justify-between border-b border-sidebar-border">
        {/* <NavUser user={data.user} /> */}
        <ModeToggle />
        <Tooltip>
            <TooltipTrigger asChild>
              <Button className="w-fit" variant="default" onClick={() => setIsExportModalOpen(true)}>
                Export
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export Skin</p>
            </TooltipContent>
          </Tooltip>
      </SidebarHeader>
      <SidebarContent>
        {/* <DatePicker /> */}
        {!selectedLayerId && (
          <SkinProperties />
        )}
        {selectedLayerId && (selectedLayer.type === 'text') && (
          <TextLayerProperties />
        )}
        {selectedLayerId && (selectedLayer.type === 'image') && (
          <ImageLayerProperties />
        )}
        {selectedLayerId && (selectedLayer.type === 'rotator') && (
          <RotatorLayerProperties />
        )}
        {selectedLayerId && (selectedLayer.type === 'bar') && (
          <BarLayerProperties />
        )}
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="h-fit flex flex-row justify-end border-b border-sidebar-border">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline"
              onClick={() => open("https://www.reddit.com/r/rainmetereditor/")} 
              
              className="hover:text-primary"
            >
              <FaReddit />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Join our Subreddit</p>
          </TooltipContent>
        </Tooltip>
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
              onClick={() => open("https://github.com/kethakav/rainmeter-editor-releases/issues")} 
              
              className="hover:text-destructive"
            >
              <Bug />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Report a Bug</p>
          </TooltipContent>
        </Tooltip>
      </SidebarFooter>
      <ExportModal
        onExport={handleExport} 
        open={isExportModalOpen} 
        onOpenChange={setIsExportModalOpen}
      />
    </Sidebar>
  )
}
