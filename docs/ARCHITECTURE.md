# Architecture

ImageTool is a zero-dependency static web application. It can run from a local folder, a small static server, or GitHub Pages.

## Components

- `index.html` defines the accessible interface and loads local assets.
- `src/app.js` owns browser interaction, image decoding, Canvas rendering, and downloads.
- `src/core.js` contains deterministic formatting, filename, and resize calculations shared by the app and tests.
- `src/styles.css` provides the responsive visual system.
- `server.js` is an optional local development server built only with Node.js standard modules.

## Image data flow

1. The user selects local files through the file input or drag and drop.
2. The browser creates temporary object URLs for decoding and preview.
3. Canvas draws pixels into a new image at the requested dimensions.
4. `canvas.toBlob` creates the requested PNG, JPG, or WebP output.
5. The browser exposes temporary local download links.
6. Object URLs are revoked when results change or the page closes.

## Privacy invariants

- Selected images must never be uploaded or included in a network request.
- The application must not add analytics, advertising, remote scripts, or remote fonts.
- Output files are created from decoded pixels; source EXIF and other file metadata are not copied.
- Features that would weaken these guarantees require prior public discussion and documentation.

## Testing strategy

Pure calculations live in `src/core.js` and use Node's built-in test runner. Browser behavior is verified with real PNG input, Canvas conversion, proportional resizing, and result inspection. GitHub Actions runs syntax and unit tests across supported Node.js versions.
