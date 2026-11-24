# PixAI Android

This is the first Android wrapper for the existing PixAI web app.

## Build
Open the `android` folder in Android Studio, or run:

```bash
gradle assembleDebug
```

The debug APK is written to:
`app/build/outputs/apk/debug/app-debug.apk`

GitHub Actions also builds the APK when Android files change. Download it from the workflow run's **Artifacts** section.

## Important
The app currently loads the hosted web client at:
`https://kourosh139672-ui.github.io/aipix/`

GitHub Pages must be enabled for this repository (deploy the repository root from the `main` branch). The APK is a WebView shell, not a fully offline native rewrite. PixAI's existing Cloudflare Worker remains the backend. Music UI can be shown, but actual music generation still depends on configuring its provider credential on the server; never place that credential in this Android app or the public repository.
