ARCANE ALCHEMIST — GAMEPLAY IMPROVEMENT PACKAGE

Included games
1. Arcane Alchemist (Potion Lab)
2. Ball Sorter
3. Two-Hand Duel
4. Healthy Sorter
5. Two-Player Sorter
6. Grab & Drop

Improvements in this revision
- Mirrored camera overlay targets now align with the mirrored camera image and fingertip coordinates.
- Ball Sorter / Healthy Sorter require the fingertip to dwell inside a specific visible target before awarding points.
- Two-Player Sorter checks hand-side/target alignment, requires a short dwell, and tracks separate player scores.
- Duel countdown restarts when either hand changes to a different valid sign, preventing a result from mixing different gestures.
- Sorter orb animations accelerate as the round progresses.
- Grab & Drop cursor is centered on the tracked pinch point; instructions identify the game arena as the interaction surface.
- Round timeout and camera startup failures stop camera tracks cleanly.
- Potion Lab camera failure/restart/end paths now release the camera stream; the ritual's pose-hold requirement increases gradually during the 60-second challenge.
- Removed an unused gesture label nested inside the video element.
- Improved button keyboard-focus visibility and target/orb feedback.

Validation performed
- JavaScript syntax check passed for index.html and potion-lab.html.
- ZIP integrity check passed.
- Local HTML image references were checked against files in the package.
- Interactive camera/gesture testing was not available in this environment. MediaPipe model loading, camera permissions, and real-device recognition must still be tested on the published HTTPS site.

Deployment
Upload the full contents of this ZIP to the same GitHub Pages folder. Do not upload only index.html; potion-lab.html and all artwork files are required. Open the HTTPS site, allow camera permission, and test each game in bright, even lighting.
