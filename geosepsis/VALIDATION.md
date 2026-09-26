# Verification record

Verified on 2026-09-25 using Node.js 22.14.0 and headless desktop Chrome.

- Production build succeeded; the five static runtime files total approximately 74 KB before compression.
- Loopback production server returned HTTP 200 at `http://localhost:3000`.
- All 8 numerical test groups passed. They cover sample covariance, eigenvector reconstruction, known distances, symmetry, affine invariance, rejection of non-SPD input, derived pressures, regularization, distance consistency, history limits, and clean initialization.
- All 20 deterministic deterioration simulations reached a computed warning, at 56–71 observations (one observation per real second during the demonstration). No warnings occurred during their first 15 observations.
- All 14 browser checks passed: eight-route rendering, eight vital cards, start/pause, simulation IDs, matrix views, warning explanation, captured and baseline comparisons, profile comparison, view controls, reset, 20 repeated start/reset cycles, desktop/mobile overflow, live timer progression, paused time, and absence of JavaScript errors.
- Browser viewport checks covered 1366 px and 390 px widths across all pages. The desktop overview was also visually inspected from a headless screenshot.
- Browser checks ran from local files with no remote assets. The application has no network calls, CDN dependencies, cloud services, authentication, analytics, or persistent personal data.

## Limits

No Raspberry Pi, MAX30102, physical display, or Linux graphical session was available. The kiosk script and device-specific performance therefore remain unverified on physical hardware. Research results were supplied in the brief and were not independently reproduced. This is software verification, not clinical validation.

Re-run numerical checks with `npm test` or open `tests/browser.html`. `tests/ui.html` exercises browser behavior; when loaded from local files, Chrome requires the test-only `--allow-file-access-from-files` flag for its iframe inspection. The application itself does not require that flag.
