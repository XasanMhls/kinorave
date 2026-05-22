EMERGENCY PLAYBACK OVERRIDE — HIGHEST PRIORITY

STOP all other work.

Movies and TV series still do NOT play.
This is the #1 critical blocker.

You must fix playback completely before anything else.

==================================================
1. ROOT CAUSE ANALYSIS
==================================================

Inspect everything related to playback:

Frontend:
- movie pages
- series pages
- watch page
- player component
- watch button
- React Router routes
- route params
- TMDb fetch logic
- stream URL generation
- player props

Backend:
- API routes
- proxy routes
- controllers
- env variables
- CORS
- stream endpoints
- socket side effects

Debug:
- browser console
- network tab
- terminal logs
- failed requests
- 404
- 401
- 500
- CORS failures

Find exact root cause.

==================================================
2. FIX BY ANY MEANS NECESSARY
==================================================

You have permission to replace anything:

- replace movie provider
- replace stream provider
- replace player library
- replace backend routes
- rewrite player logic
- rewrite watch routes
- rewrite fetch logic

Allowed players:
- React Player
- Video.js
- HLS.js
- Plyr

Pick the best one.

Goal:
movie must play.

==================================================
3. WATCH BUTTON MUST WORK
==================================================

Fix:
clicking Watch must navigate correctly.

Examples:
 /movie/:id
 /watch/:id

No dead buttons.
No broken routes.

==================================================
4. SERIES TOO
==================================================

Same for TV series:
must open and play.

==================================================
5. FALLBACK SYSTEM
==================================================

If provider A fails:
fallback to provider B automatically.

No blank player.

==================================================
6. TESTING
==================================================

Manually test at least:
- 3 movies
- 3 series

Verify:
- opens
- loads
- starts
- audio works
- fullscreen works

Do not stop until confirmed working.

==================================================
7. THEN UI FIXES
==================================================

After playback works:
- fix search text visibility
- improve auth like https://space.marsit.uz/
- polish remaining UI