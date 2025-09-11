# Design Guidelines: Photoshop Clone Web Application

## Design Approach
**Reference-Based Approach**: Drawing inspiration from Adobe Photoshop and Figma's professional interface design, emphasizing their signature dark themes, tool organization patterns, and workspace efficiency.

## Core Design Elements

### A. Color Palette
**Dark Mode Primary:**
- Primary: #1F2937 (210 22% 22%) - main UI containers
- Secondary: #374151 (220 13% 28%) - secondary panels  
- Accent: #3B82F6 (217 91% 60%) - primary actions
- Purple Accent: #8B5CF6 (248 53% 58%) - special highlights
- Background: #111827 (220 26% 14%) - main background
- Text: #F9FAFB (220 14% 96%) - primary text

### B. Typography
- **Primary Font**: Inter via Google Fonts CDN
- **Fallback**: SF Pro Display (system font)
- **Hierarchy**: 
  - Headers: font-semibold text-lg/xl
  - Body: font-medium text-sm/base
  - Labels: font-medium text-xs/sm

### C. Layout System
**Spacing Primitives**: Use Tailwind units of 2, 4, 6, and 8 consistently
- Micro spacing: p-2, m-2
- Standard spacing: p-4, gap-4
- Section spacing: p-6, mb-6
- Large spacing: p-8, mt-8

**Layout Structure**:
- Top sticky toolbar (h-16)
- Left sidebar tools panel (w-64)
- Main canvas workspace (flex-1)
- Right properties panel (w-80, collapsible)

### D. Component Library

**Toolbar Components**:
- Tool buttons: rounded-lg p-3 with hover:bg-gray-700 transitions
- Slider controls: custom styled range inputs with blue accent tracks
- Icon buttons: HeroIcons with consistent 20px sizing

**Canvas Area**:
- Canvas container: border border-gray-600 with drop-shadow
- Zoom indicator: fixed bottom-right position
- Dimension display: top-left overlay with semi-transparent background

**Panel Components**:
- Property panels: bg-gray-800 rounded-xl with subtle borders
- Collapsible sections: smooth expand/collapse animations
- Input fields: dark styling with blue focus rings

**Interactive Elements**:
- Primary buttons: bg-blue-600 hover:bg-blue-700 with smooth transitions
- Secondary buttons: border-gray-600 hover:border-gray-500
- Upload zone: dashed border with hover states

### E. Responsive Behavior
- **Desktop**: Full three-panel layout
- **Tablet**: Collapsible left sidebar, maintain right panel
- **Mobile**: Bottom sheet panels, full-width canvas

### F. Interaction Patterns
- **Drag-and-drop**: Visual feedback with border color changes
- **Tool selection**: Active state highlighting with accent colors
- **Slider adjustments**: Real-time canvas updates
- **Hover states**: Subtle transitions (duration-200)

## Professional Interface Guidelines

**Canvas Workspace**:
- Center-aligned canvas with neutral gray background
- Checkerboard pattern for transparency indication
- Smooth zoom transitions with mouse wheel support
- Pan functionality with space+drag interaction

**Tool Organization**:
- Group related tools in distinct sections
- Use dividers (border-gray-600) between tool groups
- Consistent icon sizing and spacing throughout
- Tooltip support for tool identification

**State Management Visual Cues**:
- Undo/redo button states (disabled when unavailable)
- Loading indicators for image processing
- Success/error states for file operations
- Progress indicators for exports

This design system creates a professional, Photoshop-inspired interface while maintaining modern web standards and accessibility through consistent dark theming and intuitive tool placement.