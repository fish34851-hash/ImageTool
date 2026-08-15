# ImageTool

A simple, privacy-friendly image converter that runs entirely in your browser.

ImageTool converts PNG, JPG, and WebP images locally. Your files are never uploaded to a server.

![ImageTool preview](preview.png)

## Features

- Convert images to PNG, JPG, or WebP
- Adjust JPG and WebP quality
- Drag and drop or browse for a file
- Preview the image before conversion
- Process every image locally in the browser
- Responsive interface for desktop and mobile
- Zero runtime dependencies

## Try it locally

The simplest option is to open `index.html` directly in a modern browser.

If you have Node.js installed, you can also run a local development server:

```bash
npm run dev
```

Then open <http://127.0.0.1:5173>.

No `npm install` step is required.

## Check the code

```bash
npm run check
```

## Privacy

ImageTool uses the browser's Canvas API. Selected images stay on your device and are not sent to any server. The app does not load external fonts, scripts, analytics, or trackers.

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening an issue or pull request.

## License

Licensed under the [MIT License](LICENSE).
