# Slate Editor

A lightweight, tabbed desktop code and text editor for Windows, built with [Electron](https://www.electronjs.org/) and the [Monaco Editor](https://microsoft.github.io/monaco-editor/) (the editor that powers VS Code).

## Features

- **Monaco-powered editing**: syntax highlighting, minimap, find and replace, multi-cursor editing and the other core Monaco editing features.
- **Tabbed interface**: open multiple files at once, with a modified indicator (●) on tabs that have unsaved changes.
- **Automatic language detection**: the language mode is chosen from the file extension; unknown types open as plain text.
- **18 themes**: follows your system light/dark preference on first launch. Pick a theme from the Themes menu and your choice is remembered.
- **Drag and drop**: drop one or more files onto the window to open them.
- **Command-line / "Open with" support**: pass file paths as arguments to open them on launch. Launching the app again opens another window in the running instance.
- **Safe closing**: confirmation prompts before discarding unsaved changes in a tab or closing the application.
- **Offline**: Monaco is bundled locally, so no network connection is required.

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl+N` | New tab |
| `Ctrl+O` | Open file(s) |
| `Ctrl+S` | Save (prompts for a location for untitled tabs) |
| `Ctrl+W` | Close current tab |
| `Ctrl+Tab` | Next tab |
| `Ctrl+Shift+Tab` | Previous tab |
| Middle-click on a tab | Close that tab |

The toolbar also provides **Open**, **+** (new tab) and **◐ Themes** (open the theme picker) buttons. Standard Monaco shortcuts (for example `Ctrl+F` to find and `Ctrl+H` to replace) are available inside the editor.

## Requirements

- Windows 10 or later (the installer and portable build target Windows)
- [Node.js](https://nodejs.org/) and npm, only needed to run from source or build

## Getting Started

Clone the repository and install dependencies:

```bash
git clone https://github.com/code-dev-env/slate-editor.git
cd slate-editor
npm install
```

Run the editor:

```bash
npm start
```

To open specific files on launch:

```bash
npm start -- path/to/file.txt another/file.js
```

## Building

Create a Windows NSIS installer and a portable executable with [electron-builder](https://www.electron.build/):

```bash
npm run build
```

The output is written to `dist/`:

- `SlateEditor-Setup.exe`: the installer. It performs a one-click, per-user install and creates desktop and Start Menu shortcuts.
- `SlateEditor-Portable-<version>.exe`: a portable build that needs no installation.

To build only one of them, use `npm run dist:installer` or `npm run dist:portable`.

## Project Structure

| File | Purpose |
| --- | --- |
| `main.js` | Electron main process: creates the window, handles file I/O and dialogs, confirms on close |
| `preload.js` | Exposes a small, explicit API from the main process to the renderer |
| `renderer.js` | Editor UI logic: tabs, theming, shortcuts, drag and drop, Monaco setup |
| `index.html` | Application layout and styles |
| `build/` | Application icons used by the window and installer |

## Known Limitations

- Files are read and written as UTF-8 only.
- Only Windows builds are configured.
- The installer is not code signed, so Windows SmartScreen may show a warning.

## License

Released under the [MIT License](LICENSE).
