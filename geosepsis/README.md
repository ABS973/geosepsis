# GEOSEPSIS

A local exhibition application for exploring changes in multivariate physiological relationships. **All displayed physiology is synthetic.** The mathematics is calculated from those synthetic observations. This is a research prototype, not a diagnostic medical device. Prospective clinical validation is required.

## Run

Install Node.js 20 or newer, then run from this directory:

```sh
npm install
npm test
npm run build
npm run start
```

Open **http://localhost:3000**. There are no npm dependencies and no remote runtime assets. `npm install` is optional because the implementation uses only browser and Node standard libraries. Once Node and Chromium are installed, building and running need no internet connection. Fonts use local system fallbacks.

For a quick standalone preview, open `index.html` directly in a browser. The scripts are classic local scripts so this also works without a server; use the server for exhibition deployment.

## Raspberry Pi 5

1. Use Raspberry Pi OS with a desktop session and an HDMI display.
2. Install Node.js 20+ and Chromium using the package sources appropriate to your OS release. Check `node --version`. Chromium is normally `chromium`; the launcher also supports `chromium-browser`.
3. Copy this whole project to `~/geosepsis`.
4. In a terminal:

```sh
cd ~/geosepsis
npm run build
npm test
chmod +x start-geosepsis.sh
./start-geosepsis.sh
```

The launcher starts the loopback-only server, checks readiness, and opens Chromium in kiosk mode. Server output is in `/tmp/geosepsis-server.log`. Closing the browser also stops the server. Run the launcher from a logged-in graphical desktop session, not an SSH session without display access. It requires `curl`.

For optional desktop-login startup, create `~/.config/autostart/geosepsis.desktop` with your actual absolute project path:

```ini
[Desktop Entry]
Type=Application
Name=GeoSepsis Exhibition
Exec=/home/YOUR_USER/geosepsis/start-geosepsis.sh
Terminal=false
```

Escape closes in-app explanations and exits browser fullscreen when permitted. Chromium kiosk exit is controlled by the OS/browser; use Alt+F4 to close the kiosk window. Exhibition lock can prompt before refresh or browser navigation, but cannot intercept OS shortcuts or guarantee a browser prompt in every kiosk configuration.

## Presenter flow

- Open Overview and press **Start analysis**. `S` starts/pauses; `R` resets. Shortcuts do not run while typing or in a dialog.
- A random `GS-XXXX` simulation ID identifies the local demonstration, not a person.
- Follow the live values, radial profile, covariance trajectory, and divergence graph.
- The correlated model evolves over roughly 60–90 seconds. An alert requires actual computed distance and persistence; it is not triggered by a timer. Individual runs vary.
- Use **View why** for the computed criterion and event timeline, or **Capture state** for a frozen comparison. **Compare baseline ↔ now** becomes available after 10 observations.
- Geometry contains a relationship network, equation symbols, and a five-step equation animation. Matrix Analysis exposes baseline/current/difference matrices, eigenvalues, and SPD properties.
- Reset clears the engine, timer, ID, warning, histories, event log, and snapshots. Refresh begins a fresh session. Nothing is stored or sent anywhere.

## Numerical implementation

`engine.js` generates correlated observations from shared Gaussian latent factors and independent noise. Factor strengths and means evolve smoothly, with small session timing variation. Bounded physiological values are illustrative, not a model of universal sepsis physiology. MAP = (SBP + 2DBP)/3; PP = SBP − DBP.

720 synthetic baseline observations estimate fixed means, standard deviations, and reference covariance. A 36-observation rolling window is standardized against those fixed statistics. The unbiased sample covariance is regularized as `Cov(Z) + 0.08 I`. This is necessary because derived MAP and PP introduce exact linear dependencies. Numerical regularization has no biological interpretation.

A Jacobi symmetric eigensolver verifies positive definiteness. The affine-invariant distance is computed from the eigenvalues of `A^(-1/2) B A^(-1/2)` as `sqrt(sum(log(lambda)^2))`. Invalid/nonfinite states fail explicitly; the UI pauses and rebuilds a fresh baseline with the event “Geometry state recalibrated.” It does not substitute fabricated results.

The demonstration criterion is `max(2.5, 2.4 × mean baseline-window distance)`. Persistence is the count of the last 10 observations exceeding that criterion divided by 10 (missing initial observations count as not elevated). A warning requires current distance above the criterion and persistence at least 0.8. The displayed experimental index is:

```text
round(100 × sigmoid(1.1 × distance
                    + 2 × max(0, distance change per observation)
                    + 1.8 × persistence − 4.4))
```

This index is not a sepsis probability or validated clinical score.

Each real second adds one synthetic observation, conceptually representing ten minutes. The 36-sample exhibition window therefore illustrates six hours. This is distinct from the project-reported research pipeline's hourly sampling, six-hour window, and one-hour stride. No actual six-hour patient observation occurs.

The radial profile is an interpretive visualization of fixed-baseline z-scores. Its similarity is `100 exp(−sum(z²)/160)`, not a geometric or clinical measure. The illustrated manifold is a two-dimensional projection driven by distance and HR–RR covariance change, not an isometric embedding of the 36-dimensional SPD space. Connecting lines are projected trajectories, not actual computed geodesics. Matrix values, eigenvalues, risk, distance, and relationship changes all use the real simulation state.

Simulation math runs once per second; display history is capped at 180 samples/states, the window at 36 observations, and logs at 60 events. Pausing does not accumulate elapsed observations. The interface honors reduced-motion preferences and uses a native modal dialog with keyboard focus containment.

## Research and hardware limitations

The Research page reproduces **project-reported preliminary retrospective figures supplied in the brief**. No datasets, model artifacts, or supporting statistical protocol were supplied, and the application does not claim to reproduce or independently validate those figures. They do not establish clinical effectiveness.

`DataSource` and `SimulationDataSource` are implemented. `MAX30102DataSource` is a deliberately unconnected extension point, which throws if called. Real acquisition would require a local hardware bridge, validated signal processing and signal-quality checks, and explicit data-source labels. No hardware measurements are currently used.

## Validation

`npm test` checks known covariance values, eigendecomposition reconstruction, distance identity and known diagonal values, symmetry, affine invariance, invalid SPD rejection, derived pressures, SPD regularization, 20 deterministic simulation runs, warning progression, bounded memory, and clean engine initialization. `tests/browser.html` runs the same numerical suite without Node.

Before an exhibition, verify at the actual display resolution, disconnect Wi-Fi, run repeated demonstrations, inspect the matrix and warning views, and exercise pause/reset and the kiosk launcher. Headless desktop validation does not certify Raspberry Pi frame rate or physical hardware behavior.

## Files

- `app.js`: all eight pages, local session controls, visualizations, drawers, snapshots.
- `engine.js`: data-source interface, simulation, linear algebra, covariance geometry.
- `styles.css`: responsive dark biomedical interface and reduced-motion styles.
- `scripts/build.mjs`: creates the dependency-free static build.
- `scripts/server.mjs`: serves the build on loopback port 3000.
- `start-geosepsis.sh`: Raspberry Pi local kiosk launcher.
- `tests/`: reproducible numerical verification.
