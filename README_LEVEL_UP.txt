ARCANE ALCHEMIST — LEVEL-UP EDITION

Contents
- index.html: main arcade with seven camera-driven mini-games plus the Potion Lab entry
- potion-lab.html: existing Potion Lab
- assets/: original fantasy art and backgrounds

Level-up options added
1. Healthy Sorter — food sorting with short general nutrition facts.
2. Two-Player Sorter — two hands control separate sides and separate player scores.
3. Grab & Drop — pinch to pick up a magic orb, move while pinching, open fingers to drop.
4. Hand Rehab Coach — gentle pose-hold practice with repetition count. This is not a medical assessment or treatment.

Existing modes retained
- Ball Sorter
- Two-Hand Duel
- Arcane Alchemist Potion Lab

Run / deploy
- Keep index.html, potion-lab.html, and the assets folder together.
- Deploy the folder contents to GitHub Pages or another HTTPS static host.
- Open index.html on the deployed HTTPS site, choose a game, then press Start Camera & Play and allow camera access.
- MediaPipe assets load from external CDNs, so an internet connection is required.
- Test in bright light, keep hands in view, and test both desktop and phone.

Notes
- This package received a JavaScript syntax check, but browser/camera play-testing was not available in this build step.
- Gesture detection can vary with camera angle, lighting, hand orientation, and device performance.
- Nutrition facts are general education, not individualized medical advice. Hand Rehab Coach is a simple pose practice game, not clinical rehabilitation guidance.


USER-PROVIDED ART INTEGRATION
The home library now displays the supplied Arcane Alchemist interface reference and provided fantasy images in the game cards. The supplied ice mage, rogue alchemist character sheets, crystal sanctum, and moonlit river are copied into assets/ and used by the arcade and Potion Lab. Keep the assets folder beside both HTML files when deploying.
