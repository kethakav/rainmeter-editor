// src/components/Layout.tsx
import React from 'react'
import CanvasRenderer from './CanvasRenderer'
import PropertiesSidebar from './PropertiesSidebar'
import LayersSidebar from './LayersSidebar'
import Toolbar from './Toolbar'
import { Toaster } from './ui/toaster'
import Topbar from './Topbar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from './ui/sidebar'
import { AppSidebar } from './app-sidebar'
import SidebarLeft from './sidebar-left'
import { Separator } from '@radix-ui/react-select'
import { SidebarRight } from './sidebar-right'
// Test comment

const Layout: React.FC = () => {
  return (
    <SidebarProvider>
    <SidebarLeft />
    <SidebarInset>
      <CanvasRenderer />
      <Toolbar />
    </SidebarInset>
    <SidebarRight />
  </SidebarProvider>
    // <div className="flex flex-col h-screen">
    //   <Topbar />
    //   <div className="flex flex-col flex-1 overflow-hidden">
    //   <SidebarProvider>
    //     <div className="relative flex-1 overflow-hidden">
          
    //         <div className="absolute left-0 z-10">
    //           <Toolbar />
    //           <LayersSidebar />
    //         </div>
    //         <div className="absolute top-0 z-1">
    //           <CanvasRenderer />
    //           <SidebarTrigger />
    //         </div>
    //         {/* <div className="absolute right-0 z-10">
    //           <PropertiesSidebar />
    //         </div> */}
    //         <AppSidebar />
          
    //     </div>
    //     </SidebarProvider>
    //     <Toaster />
    //   </div>
    // </div>
  )
}

export default Layout
