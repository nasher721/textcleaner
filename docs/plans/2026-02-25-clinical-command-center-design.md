# Design Document: The Clinical Command Center

**Date:** 2026-02-25
**Topic:** Textcleaner Option 1 Improvements

## Overview
Transforming the Textcleaner application into a premium, unified workspace for clinicians and data labelers. The focus is on speed, visual clarity, and workflow efficiency.

## Design Goals
1. **Premium Aesthetic**: Dark mode, modern typography (Outfit), and subtle animations.
2. **Unified Navigation**: Sidebar-driven layout for seamless switching.
3. **Clinical Efficiency**: Real-time cleaning with side-by-side comparison.
4. **Data Labeling Speed**: Hotkey-driven sentence and span annotation.

## UI Architecture

### 1. Global Layout
- **Sidebar**: Sticky left sidebar with navigation links (Dashboard, Inference, Labeling, Training) and Model Selection.
- **Header**: Current view title and API status indicators.
- **Main Area**: Scrollable content area for the active tool.

### 2. Inference View (The Workspace)
- **Input Area**: Large, syntax-highlighted editor for raw notes.
- **Live Preview**: Parallel view showing the "Cleaned" version.
- **Keep Slider**: A smooth range input to adjust the model's threshold in real-time.
- **Structured Cards**: Extracted findings (Neuro, Labs, etc.) shown as sleek, copyable data cards.

### 3. Labeling View (The Factory)
- **Note Navigation**: List of notes to be labeled.
- **Segment View**: Sentences highlighted with their current status.
- **Hotkey Action**:
    - `K`: KEEP
    - `R`: REMOVE
    - `Next`: Move to next note.

## Technical Changes

### Backend Enhancements
- [MODIFY] `app/main.py`: Add metadata to `/api/models` to include performance metrics if available.
- [MODIFY] `app/database.py`: Support for better note filtering (labeled vs unlabeled).

### Frontend Overhaul
- **CSS**: Implement a robust CSS variable system in `globals.css`.
- **Components**:
    - `Sidebar.tsx`: Navigation and global state.
    - `ThresholdSlider.tsx`: Custom range input.
    - `EntityCard.tsx`: For structured extraction display.
- **Pages**: Rewrite `infer`, `label`, and `page` to use the new layout.

## Verification
- Manual verification of hotkeys.
- Browser test (Playwright) for the split-pane synchronization.
- CSS audit for accessibility and responsive design.
