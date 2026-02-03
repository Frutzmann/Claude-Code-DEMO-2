---
status: testing
phase: 03-generation-gallery
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md, 03-04-SUMMARY.md]
started: 2026-02-03T13:20:00Z
updated: 2026-02-03T13:20:00Z
---

## Current Test

number: 1
name: Generate sidebar link enabled
expected: |
  In the dashboard sidebar, the "Generate" link is enabled (not grayed out) and clicking it navigates to /generate.
awaiting: user response

## Tests

### 1. Generate sidebar link enabled
expected: In the dashboard sidebar, the "Generate" link is enabled (not grayed out) and clicking it navigates to /generate.
result: [pending]

### 2. Portrait selector shows portraits
expected: On the /generate page, a portrait dropdown shows all your portraits with thumbnail previews. Your active portrait is marked with "(Active)" badge.
result: [pending]

### 3. Background upload accepts files
expected: Drag-and-drop or click to add up to 7 background images. Images appear in a preview grid. You can remove individual images.
result: [pending]

### 4. Quota display shows usage
expected: Below the form, you see your generation usage: "X / 5 generations this month" (or "Admin - Unlimited" if admin).
result: [pending]

### 5. Submit button state
expected: Submit button is disabled when no backgrounds are selected or when quota is exceeded. It enables once you have at least 1 background and quota available.
result: [pending]

### 6. Gallery sidebar link enabled
expected: In the dashboard sidebar, the "Gallery" link is enabled (not grayed out) and clicking it navigates to /gallery.
result: [pending]

### 7. Gallery shows empty state
expected: If you have no generations yet, /gallery shows an empty state message with a link to /generate.
result: [pending]

### 8. Gallery list shows generations
expected: If you have generations, /gallery shows a list with keywords, thumbnail count, status badge (completed/failed/etc), and relative time ("2 hours ago").
result: [pending]

### 9. Generation detail page
expected: Clicking a generation in the gallery navigates to /gallery/[id] showing the keywords used, portrait thumbnail, background count, status, and creation date.
result: [pending]

### 10. Thumbnail grid display
expected: On the generation detail page, completed thumbnails display in a responsive grid (2 cols mobile, 3 md, 4 lg).
result: [pending]

### 11. Individual thumbnail download
expected: Hovering a thumbnail shows a download button overlay. Clicking it downloads that single image.
result: [pending]

### 12. Batch ZIP download
expected: "Download All" button creates and downloads a ZIP file containing all thumbnails from the generation.
result: [pending]

## Summary

total: 12
passed: 0
issues: 0
pending: 12
skipped: 0

## Gaps

[none yet]
