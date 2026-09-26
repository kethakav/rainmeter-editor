# Rainmeter Editor Analysis & Feature Recommendations

## Current Codebase Functionalities

Based on a review of the `rainmeter-editor` codebase (specifically `ExportToINI.ts`, `Toolbar.tsx`, `PropertiesSidebar.tsx`, and `LayerManager.ts`), the editor currently supports the following:

### 1. Canvas & Editing
- **Interactive Canvas**: Drag, drop, resize, and rotate elements using Fabric.js.
- **Layer Management**: Reordering (drag-and-drop), selecting, and deleting layers via a left sidebar.
- **Property Editing**: Modifying X, Y, dimensions, rotation, color, opacity, font size, and specific measure properties.

### 2. Supported Meters (Visuals)
- **String**: For displaying text, with support for local custom fonts.
- **Image**: For displaying static images.
- **Rotator**: For rotating images based on a measure.
- **Bar**: For progress bars with background and foreground colors.
- **Shape**: Recently implemented support for Rectangles, Circles, Triangles, and Lines.

### 3. Supported Measures (Data)
- **Time/Date**: Various formatting options (12/24hr, full date, etc.).
- **CPU**: Average usage and per-core usage.
- **FreeDiskSpace**: Total, used, and free space for the C: drive.

### 4. Export System
- Generates valid Rainmeter `skin.ini` files.
- Automatically packages local fonts into `@Resources/Fonts`.
- Automatically copies used images into `@Resources/Images`.

---

## Rainmeter Capabilities (Web Search Findings)

Rainmeter is vastly more powerful than what is currently implemented in the editor. Its core strength lies in **Plugins**, **Interactive Bangs**, and **Advanced Data Fetching**.

### Missing Native Features
- **Meters**: Histogram, Line chart, Bitmap, and Button.
- **Measures**: NetIn/NetOut (Network), PhysicalMemory/SwapMemory (RAM), Uptime.

### Missing Advanced Features
- **Plugins**:
  - **AudioLevel**: Used for audio visualizers (equalizers).
  - **WebParser**: Used for fetching weather data, RSS feeds, or API data.
  - **NowPlaying / WebNowPlaying**: Used for media player controls and album art.
  - **RunCommand**: Executing shell scripts.
- **Interactivity & Bangs**: Actions like `LeftMouseUpAction`, `MouseOverAction`, and triggering commands (`[!ShowMeter]`, `[!SetVariable]`, `["C:\App.exe"]`).
- **Dynamic Variables**: Defining a set of variables (`#Color1#`, `#Scale#`) that apply across multiple meters.

---

## Recommended Features to Add to the Editor

To bridge the gap between your editor and Rainmeter's full potential, I recommend adding the following features, ordered by impact and feasibility:

### Priority 1: High Demand & Easy Implementation
1. **RAM & Network Measures**: Expand the dropdowns for String, Bar, and Rotator meters to include RAM Usage, Network Download (NetIn), and Network Upload (NetOut). These are native Rainmeter measures and very easy to add to `ExportToINI.ts`.
2. **Global Variable Manager**: Create a panel where users can define variables (e.g., `#MainColor# = 255,255,255`). Allow them to assign these variables to elements instead of static colors.

### Priority 2: Interactivity
3. **Actions & Bangs Panel**: Add a section in the Properties Sidebar where users can assign a `LeftMouseUpAction` to any element. This would allow users to create desktop shortcuts or app launchers (e.g., action: `["C:\Program Files\Google\Chrome\Application\chrome.exe"]`).
4. **Hover Effects**: Allow users to set a different color or opacity when hovering over an element, exporting as `MouseOverAction` and `MouseLeaveAction`.

### Priority 3: Advanced Visuals & Plugins
5. **Audio Visualizer Tool**: This is one of the most sought-after Rainmeter features. Create a new "Visualizer" tool that generates multiple Bar meters linked to an `AudioLevel` plugin measure.
6. **Media Player Widget**: A tool that adds a preset group of elements (Album Art Image, Song Title String, Play/Pause Button) mapped to the `NowPlaying` plugin.
7. **Weather Widget (WebParser)**: Add a simple weather preset that uses the `WebParser` plugin to fetch temperature and conditions from a free weather API.

### Priority 4: Editor UX Improvements
8. **Grouping**: Allow users to group multiple elements together in the canvas so they can move them as a single unit (exports with `Group=MyGroup` in Rainmeter).
9. **Project Saving/Loading**: The left sidebar shows this is "Coming Soon." Implementing local JSON serialization of the Fabric canvas to save and load `.rmproj` files would be highly beneficial.
