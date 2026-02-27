# Minecraft Build Studio — Full Copilot Build Prompt

## Project Overview

Build a fully functional, modern web application called **"Minecraft Build Studio"** — an all-in-one tool for planning, designing, and generating Minecraft builds. The app should feel polished, dark-themed, and professional, inspired by tools like Figma and VS Code. Use **React + TypeScript** for the frontend, **Three.js** for 3D rendering, **Tailwind CSS** for styling, and **Zustand** for global state management.

---

## Design System & Visual Style

**Theme:** Dark mode only. Deep charcoal backgrounds (`#0f1117`), slightly lighter panels (`#1a1d27`), card surfaces at (`#22263a`). Accent color is **Minecraft green** (`#4caf50`) with a secondary accent of **stone blue** (`#5c7cfa`). All interactive elements should have smooth hover/active transitions (150ms ease).

**Typography:** Use **Inter** from Google Fonts. Headings bold, body regular, monospace for coordinates and block counts.

**Iconography:** Use **Lucide React** icons throughout.

**Layout:** A persistent left sidebar for navigation, a top toolbar that changes contextually based on the active tool, and a large main content/canvas area. A collapsible right panel for properties, settings, and output. Think app-shell layout — the sidebar and top bar are always visible, content area fills remaining space.

**Sidebar Navigation:** Icon + label navigation items for each major section:
- Editor (grid icon)
- Schematic Viewer (cube icon)
- Blueprint Generator (image icon)
- Material Calculator (list icon)
- Cost Estimator (coins icon)
- Palette Suggester (palette icon)
- Structure Generator (wand icon)
- Floor Plan Generator (layout icon)
- Style Transfer (layers icon)
- Library (bookmark icon)

Active nav item should highlight with the green accent and a left border indicator. Sidebar should be collapsible to icon-only mode.

---

## Section 1 — Grid-Based Layer Editor (Voxel Editor)

### Layout
The editor takes up the full content area. The top toolbar shows: layer controls (current layer, up/down arrows, layer count), view toggle (2D/3D), grid size selector (8x8 up to 64x64), and tool palette.

### Functionality
- **2D View (default):** A top-down grid rendered on an HTML Canvas. Each cell represents one Minecraft block. Users click to place a block, right-click to erase. The current Y-layer is shown above the grid. Users can step up and down through layers (Y-axis). Each layer is independently editable.
- **3D View:** Render the entire multi-layer build in Three.js as colored voxels. Orbit controls (rotate, zoom, pan). Toggle between wireframe and solid. Blocks are colored to approximate their Minecraft color.
- **Block Palette:** A scrollable panel on the right listing common Minecraft blocks grouped by category (Stone, Wood, Terracotta, Glass, etc.). Each block shows its color swatch and name. Clicking selects it as the active brush. Include a search input to filter blocks.
- **Tools:** Pencil (place single block), Eraser, Fill Bucket (flood fill on current layer), Rectangle Select, and Copy/Paste selection.
- **Layer management:** Layers panel lists all Y-levels with a visibility toggle eye icon for each. Users can add/remove layers. Active layer highlighted.
- **Undo/Redo:** Full undo/redo stack (Ctrl+Z / Ctrl+Y).
- **Export:** Export the build as a JSON schematic format, and optionally as a `.nbt` placeholder file. Also export current view as PNG.
- **Grid settings:** Toggle grid lines on/off, change grid size, enable snapping.
- **Save:** Save button in top toolbar opens a modal to name and describe the build, then writes to SQLite. Auto-save debounces 3 seconds after any edit and overwrites the autosave record. Show a subtle "Auto-saved" toast notification.

---

## Section 2 — Schematic Viewer

### Layout
Full content area used for the 3D viewer. Top toolbar has: import button, view options (solid/wireframe/xray), camera presets (top, front, side, isometric, free), and layer range slider.

### Functionality
- **File Import:** Drag-and-drop or file picker for `.schematic` and `.litematic` files. Parse the binary NBT format using a JavaScript NBT parser library (use `nbt` npm package or similar). Display loading progress.
- **3D Render:** Render the parsed schematic as colored voxels in Three.js. Use instanced mesh rendering for performance (support builds up to 256x256x256). Color each block type with its approximate Minecraft color pulled from a built-in block color map.
- **Layer slicer:** A dual-handle range slider that controls which Y-layers are visible — useful for inspecting the interior of builds.
- **Block info:** Hovering a block shows a tooltip with its block type name and coordinates (X, Y, Z).
- **Stats panel (right sidebar):** Shows total block count, unique block types used, and dimensions (W x H x D).
- **Camera controls:** OrbitControls from Three.js. Preset buttons snap to common angles. Reset camera button.
- **Search blocks:** Type a block name to highlight all instances of that block in the viewer with a glowing outline.
- **Save:** Save the imported schematic (file + parsed data) to SQLite via the schematics table.

---

## Section 3 — Blueprint Generator (Image to Pixel Art)

### Layout
Split panel: left side has the upload/settings area, right side shows the output grid blueprint.

### Functionality
- **Image Upload:** Drag-and-drop or file picker. Accepts PNG/JPG/GIF. Preview the image after upload.
- **Settings panel:**
  - Output size: width in blocks (16 to 128), height auto-calculated to maintain aspect ratio
  - Block palette mode: Full palette (all Minecraft blocks), Simplified (common building blocks only), Custom (user selects allowed blocks from a checklist)
  - Dithering toggle (Floyd-Steinberg dithering for better color matching)
  - Layer mode: Single flat build or extruded by brightness (3D terrain effect)
- **Processing:** On clicking "Generate", downsample the image to the target resolution, then map each pixel to the closest matching Minecraft block color using Euclidean distance in RGB space. Display the result as a colored grid with block names on hover.
- **Output panel:** The blueprint grid, zoomable and pannable. Each cell shows the block color. On hover, show block name. Click any cell to manually override the block type.
- **Material list:** Below or beside the grid, show a sorted list of all blocks needed and their quantities.
- **Export:** Export the blueprint as PNG image, as CSV (x, y, block_name), or send directly to the Layer Editor.
- **Save:** Save blueprint (source image + output grid + settings) to SQLite via the blueprints table.

---

## Section 4 — Material Calculator

### Layout
Clean form-based layout with a results panel. No canvas needed here — this is a utility UI.

### Functionality
- **Input modes:**
  - **Manual entry:** User inputs build dimensions (L x W x H) and selects a build type (solid cube, hollow box, flat floor, walls only, cylinder, sphere). Calculate exact block counts mathematically.
  - **From Editor:** Pull block data directly from the current Layer Editor session and calculate materials from actual placed blocks.
  - **From Schematic:** Load a schematic file and calculate materials from parsed data.
- **Results table:** Sorted list of blocks needed with quantities. Columns: Block Name, Count, Stacks (count ÷ 64, rounded up), Shulker Boxes (count ÷ 1728, rounded up).
- **Filters:** Toggle to show/hide air blocks, filter by category.
- **Export:** Copy to clipboard as plaintext, export as CSV, export as JSON.
- **Totals row:** Show grand total block count and a summary.

---

## Section 5 — Build Cost Estimator

### Layout
Two-column layout: left for configuration and block price inputs, right for cost breakdown results.

### Functionality
- **Server economy setup:** User defines their server's currency name (e.g. "Diamonds", "Gold", "Coins"). Option to set a default price per block or per stack.
- **Price table:** A searchable, editable table of all Minecraft blocks with a price-per-block field. Pre-populate with sensible defaults (common blocks cheaper, rare blocks more expensive). Allow import/export of price tables as JSON so users can save their server's economy config.
- **Cost calculation:** Connect to the Material Calculator output. Multiply block quantities by their prices and sum totals.
- **Results:** Total cost displayed prominently. Itemized cost breakdown table. Pie chart (using Recharts) showing cost distribution by block category.
- **Budget mode:** User sets a budget and the app highlights which materials are over-budget or suggests cheaper alternatives.
- **Save/Load:** Save economy configs to SQLite via the economy_configs table. Load saved configs from the Library.

---

## Section 6 — Palette Suggester

### Layout
Card-based layout. Style picker on the left, suggested palettes displayed as swatches on the right.

### Functionality
- **Style picker:** A grid of style cards the user can click to select. Styles include: Rustic, Medieval, Modern, Japanese, Fantasy, Nether, End, Ocean, Desert, Arctic, Industrial, Cottagecore. Each card has an evocative icon and label.
- **Optional seed block:** User can optionally pick a "seed block" they already want to use, and the palette will be generated around it.
- **Palette output:** For each selected style, display 6–10 suggested block swatches with block names. Group into: Primary (main structure), Secondary (accents/trim), Accent (details/highlights), Floor, Roof/Ceiling.
- **Palette data:** Hard-code curated palettes per style in a JSON config file. This does not need to be AI-generated — a well-curated static dataset is fine and more reliable.
- **Copy palette:** Copy block list to clipboard. Send palette to the Layer Editor to pre-populate the block palette panel.
- **Favorites:** Save favorite palettes to SQLite via the palettes table. View saved palettes in the Library.

---

## Section 7 — Structure Generator (AI / Procedural)

### Layout
Prompt input at the top, settings panel below it, and a large 3D preview canvas taking up the rest of the space. Right panel shows block list and export options.

### Functionality
- **Text prompt input:** Large textarea for describing the structure (e.g. "small Japanese shrine with wooden pillars and a curved roof, surrounded by cherry blossom trees"). Character limit 500.
- **Settings:**
  - Size: Small / Medium / Large
  - Style: Auto-detect from prompt, or manually override with style dropdown
  - Complexity: Simple / Detailed
  - Biome context: Overworld / Nether / End
- **Generation:** For v1, use a **rule-based procedural generator** (not actual AI) that interprets keywords from the prompt to select and assemble pre-defined structural modules (walls, roofs, doors, windows, floors, decorations). Map keywords like "Japanese" → use wood/stone block palette + curved roof module, "dungeon" → stone bricks + torches + iron bars, etc. Document in comments that this can be swapped for an actual LLM API call in a future version.
- **Preview:** Render the generated structure as voxels in Three.js with full orbit controls.
- **Regenerate:** Button to generate a variation with a different random seed.
- **Export:** Send to Layer Editor, export as JSON schematic.
- **Save:** Save generated structure (prompt + settings + voxel data + thumbnail) to SQLite via the structures table.

---

## Section 8 — Procedural Floor Plan Generator

### Layout
Settings panel on the left, large 2D floor plan canvas on the right with a 3D toggle.

### Functionality
- **Building type selector:** House, Castle, Dungeon, Village, Tower, Temple, Barn, Tavern.
- **Parameters:**
  - Overall footprint size (e.g. 20x20 blocks)
  - Number of rooms (for buildings with rooms)
  - Room size range (min/max)
  - Corridor style: straight, winding, none
  - Special features checkboxes: secret rooms, treasure room, boss room, courtyard, garden, basement
- **Generation algorithm:** Use BSP (Binary Space Partitioning) tree algorithm to recursively split the space into rooms, then connect them with corridors. For castles/dungeons, use cellular automata for organic cave-like layouts.
- **2D Output:** Render the floor plan on Canvas. Color-code room types (green = entrance, blue = rooms, yellow = corridors, red = special rooms). Show room labels.
- **3D Output:** Extrude the floor plan to 3D using default wall/floor blocks based on building type. Render in Three.js.
- **Edit:** Allow users to click rooms to rename or change their type. Drag walls to resize rooms (simplified).
- **Export:** Send to Layer Editor, export floor plan as PNG or JSON.
- **Save:** Save floor plan (parameters + room data + voxel data + thumbnail) to SQLite via the floor_plans table.

---

## Section 9 — Style Transfer (Image to Block Texture Mapping)

### Layout
Split three-panel layout: source image upload (left), style settings (middle), output result (right).

### Functionality
- **Source image upload:** Upload a reference image (photo, painting, texture). Preview displayed.
- **Mapping mode:**
  - **Color match:** Map each region of the image to a Minecraft block with the closest average color (similar to Blueprint Generator but applied to textures/surfaces).
  - **Texture match:** Match not just color but also texture character (smooth → stone/concrete, rough → cobblestone/gravel, organic → wood/leaves). Implement via a simple texture descriptor lookup table.
  - **Pattern extraction:** Extract repeating patterns from the image and suggest block combinations that recreate that pattern.
- **Surface selector:** User defines what surface they're styling (wall, floor, ceiling, roof) and the output palette is tailored accordingly.
- **Output:** A styled palette of 4–8 blocks with percentages showing how much of each to use. Visual mockup showing a flat 10x10 surface rendered with the suggested blocks.
- **Apply to editor:** Button to push suggested palette to the Layer Editor.
- **Save:** Save style transfer result (source image + settings + result palette) to SQLite via the style_transfers table.

---

## Section 10 — Library (Unified Saved Items Browser)

### Layout
Full content area. Tab bar at the top for each content type. Card grid below showing saved items.

### Functionality
- **Tabs:** Builds, Schematics, Blueprints, Structures, Floor Plans, Palettes, Style Transfers, Economy Configs.
- **Card grid:** Each saved item shows a thumbnail (or placeholder block icon), name, date saved, and quick action buttons: Open, Duplicate, Delete.
- **Inline rename:** Double-click a card name to rename it inline.
- **Context menu ("..." button):** Rename, Duplicate, Export, Delete.
- **Search and filter:** Search bar to filter by name. Sort by: newest, oldest, name A-Z.
- **Export from Library:**
  - Builds → export as `.json` schematic
  - Schematics → export original file back out
  - Blueprints → export as PNG or CSV
  - Palettes → export as `.json`
  - Economy configs → export as `.json`
- **Full Library backup:** A "Export All Data" button that serializes the entire SQLite DB and downloads it as a `.sqlite` file. A matching "Import Backup" button to restore from that file.

---

## Database & Persistence Layer

**Use SQLite via `sql.js`** (a WebAssembly port of SQLite that runs entirely in the browser — no backend needed). Persist the SQLite database file to IndexedDB via the `idb` npm package (better storage limits than localStorage — SQLite DB can get large). On app load, initialize the DB from IndexedDB if it exists, otherwise create a fresh DB. On every write operation, serialize and save the DB back to IndexedDB.

Configure `sql.js` to load its `.wasm` file correctly in Vite by copying the wasm file to the `/public` directory and setting the `locateFile` option in the sql.js init config to point there.

### Database Schema

```sql
-- Saved editor sessions / builds
CREATE TABLE IF NOT EXISTS builds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail BLOB,
  layers_json TEXT,
  grid_width INTEGER,
  grid_height INTEGER,
  layer_count INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Imported schematics
CREATE TABLE IF NOT EXISTS schematics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  file_name TEXT,
  file_data BLOB,
  parsed_json TEXT,
  dimensions_json TEXT,
  block_count INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Saved blueprints (image to pixel art results)
CREATE TABLE IF NOT EXISTS blueprints (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source_image BLOB,
  output_grid_json TEXT,
  settings_json TEXT,
  width INTEGER,
  height INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Economy / price configs for cost estimator
CREATE TABLE IF NOT EXISTS economy_configs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  currency_name TEXT,
  price_table_json TEXT,
  is_default INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Saved block palettes
CREATE TABLE IF NOT EXISTS palettes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  style TEXT,
  blocks_json TEXT,
  is_favorite INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Generated structures
CREATE TABLE IF NOT EXISTS structures (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  prompt TEXT,
  settings_json TEXT,
  voxel_data_json TEXT,
  thumbnail BLOB,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Generated floor plans
CREATE TABLE IF NOT EXISTS floor_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  building_type TEXT,
  parameters_json TEXT,
  rooms_json TEXT,
  voxel_data_json TEXT,
  thumbnail BLOB,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Style transfer results
CREATE TABLE IF NOT EXISTS style_transfers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source_image BLOB,
  settings_json TEXT,
  result_palette_json TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- App-wide user preferences
CREATE TABLE IF NOT EXISTS preferences (
  key TEXT PRIMARY KEY,
  value TEXT
);
```

### Database Utility Layer

Create `src/db/database.ts` as the central DB module that handles initialization, loading from IndexedDB, and saving back to IndexedDB. All other DB modules import the db instance from here.

Each table gets its own module with fully typed async CRUD functions:

```
src/db/
  database.ts        -- init, load/save to IndexedDB, expose db instance
  builds.ts          -- saveBuild, getBuildById, getAllBuilds, updateBuild, deleteBuild
  schematics.ts      -- saveSchematic, getSchematicById, getAllSchematics, deleteSchematic
  blueprints.ts      -- saveBlueprint, getBlueprintById, getAllBlueprints, deleteBlueprint
  economy.ts         -- saveEconomyConfig, getEconomyConfigs, setDefaultConfig, deleteConfig
  palettes.ts        -- savePalette, getPalettes, toggleFavorite, deletePalette
  structures.ts      -- saveStructure, getStructureById, getAllStructures, deleteStructure
  floorPlans.ts      -- saveFloorPlan, getFloorPlanById, getAllFloorPlans, deleteFloorPlan
  styleTransfers.ts  -- saveStyleTransfer, getAllStyleTransfers, deleteStyleTransfer
  preferences.ts     -- getPreference, setPreference, getAllPreferences
```

Each function should: open a db transaction, run the query, commit, then trigger a serialization + save to IndexedDB. Use TypeScript interfaces for all table row types defined in `src/db/types.ts`.

### Auto-save Behavior

- In the Layer Editor, after any block placement or edit, debounce 3 seconds and auto-save to a special record with id `autosave` in the builds table (overwrite, not insert).
- On app load, check if an `autosave` record exists. If it does, show a dismissable banner: "You have an unsaved session from [timestamp]. Restore it?" with Restore and Dismiss buttons.
- Show a subtle "Auto-saved" toast (bottom-right, 2s duration) after each auto-save completes.

---

## Global Features & Technical Requirements

**State Management:** Use Zustand with separate slices for editor state, schematic viewer state, UI state (active panel, sidebar collapsed, active tool, etc.), palette state, and calculator state.

**Routing:** Use React Router for navigating between sections. Each section is its own route:
`/editor`, `/viewer`, `/blueprint`, `/calculator`, `/cost`, `/palette`, `/structure`, `/floorplan`, `/style-transfer`, `/library`

**Performance:**
- Three.js scenes must use instanced mesh rendering for voxels — never create individual mesh objects per block.
- Canvas-based 2D grid should use dirty-rect rendering to only redraw changed cells.
- Heavy operations (image processing, schematic parsing, structure generation) should run in Web Workers to avoid blocking the UI thread.
- SQLite writes should be fire-and-forget (non-blocking) — don't await them in UI event handlers, use a background queue.

**Block Data:** Include a `src/data/blocks.json` file with at minimum 200 common Minecraft blocks, each entry containing:
```json
{
  "id": "minecraft:stone",
  "name": "stone",
  "displayName": "Stone",
  "color": "#7f7f7f",
  "category": "Stone",
  "textureCharacter": "rough",
  "defaultPrice": 1
}
```
Categories should include: Stone, Wood, Planks, Terracotta, Concrete, Glass, Metal, Organic, Nether, End, Decorative, Utility.

**Responsiveness:** The app is desktop-first (min-width 1280px) but should not break below that — sidebar collapses to icon-only, panels stack vertically.

**Accessibility:** All interactive elements have `aria-label`. Keyboard navigation supported in the editor (arrow keys to move cursor, Space to place block, E for eraser, F for fill, Ctrl+Z/Y for undo/redo).

**Error handling:** All file imports, DB operations, and generation steps should have graceful error states with user-friendly messages shown in a toast or inline error component. No raw error dumps to the UI.

**Toasts:** Implement a global toast notification system (bottom-right corner). Types: success (green), error (red), info (blue), warning (yellow). Auto-dismiss after 3s. Stack multiple toasts.

---

## File Structure

```
public/
  sql-wasm.wasm          -- sql.js wasm file (copy from node_modules/sql.js/dist/)

src/
  components/
    layout/
      Sidebar.tsx
      TopToolbar.tsx
      RightPanel.tsx
      ToastManager.tsx
    editor/
      LayerEditor.tsx
      VoxelCanvas2D.tsx
      VoxelScene3D.tsx
      BlockPalette.tsx
      LayerManager.tsx
      EditorToolbar.tsx
    viewer/
      SchematicViewer.tsx
      SchematicScene3D.tsx
      LayerSlider.tsx
    blueprint/
      BlueprintGenerator.tsx
      BlueprintGrid.tsx
      BlueprintSettings.tsx
    calculator/
      MaterialCalculator.tsx
      MaterialResultsTable.tsx
    cost/
      CostEstimator.tsx
      PriceTable.tsx
      CostBreakdownChart.tsx
    palette/
      PaletteSuggester.tsx
      StyleCard.tsx
      PaletteSwatches.tsx
    structure/
      StructureGenerator.tsx
      StructureScene3D.tsx
      StructureSettings.tsx
    floorplan/
      FloorPlanGenerator.tsx
      FloorPlanCanvas.tsx
      FloorPlanScene3D.tsx
    styletransfer/
      StyleTransfer.tsx
      StyleTransferSettings.tsx
    library/
      Library.tsx
      LibraryCard.tsx
      LibraryTabs.tsx
    ui/
      Modal.tsx
      Toast.tsx
      Button.tsx
      Input.tsx
      Select.tsx
      Tabs.tsx
      Tooltip.tsx
      ContextMenu.tsx
      DragDropZone.tsx
      RangeSlider.tsx

  db/
    database.ts
    types.ts
    builds.ts
    schematics.ts
    blueprints.ts
    economy.ts
    palettes.ts
    structures.ts
    floorPlans.ts
    styleTransfers.ts
    preferences.ts

  store/
    editorStore.ts
    viewerStore.ts
    uiStore.ts
    paletteStore.ts
    calculatorStore.ts
    toastStore.ts

  utils/
    nbtParser.ts
    colorMatcher.ts
    proceduralGen.ts
    bspGenerator.ts
    imageProcessor.ts
    blockColors.ts
    exporters.ts
    workers/
      imageWorker.ts
      schematicWorker.ts
      generatorWorker.ts

  data/
    blocks.json
    palettes.json
    styleKeywords.json

  App.tsx
  main.tsx
  index.css
```

---

## npm Packages Required

```
react
react-dom
react-router-dom
typescript
three
@types/three
zustand
tailwindcss
lucide-react
recharts
sql.js
idb
uuid
@types/uuid
nbt                    -- for parsing Minecraft NBT/schematic files
vite
@vitejs/plugin-react
```

**Vite config note:** Add the following to `vite.config.ts` to correctly handle the sql.js wasm file and prevent it from being bundled:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['sql.js']
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  }
})
```

---

## Deliverable Expectations

- Fully functional React app runnable with `npm install && npm run dev`
- All 9 tool sections plus the Library implemented and navigable via the sidebar
- SQLite database initialized on first load, persisted to IndexedDB, and correctly restored on reload
- All save/load flows working: manual save via modal, auto-save in the editor, and Library open/delete/export
- No placeholder or lorem ipsum content — all features should be genuinely interactive
- Three.js 3D scenes working in: Layer Editor, Schematic Viewer, Structure Generator, and Floor Plan Generator
- Blueprint Generator must genuinely process uploaded images and output a real block-mapped grid using color distance matching
- Material Calculator must produce accurate results for all three input modes (manual, from editor, from schematic)
- All DB CRUD operations typed with TypeScript interfaces
- Web Workers used for image processing, schematic parsing, and structure generation
- Clean, consistent UI across all sections following the design system defined above
- Commented code explaining key algorithms (BSP room generation, Floyd-Steinberg dithering, instanced voxel rendering, color distance matching, sql.js IndexedDB persistence pattern)
