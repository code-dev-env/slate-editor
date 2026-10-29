const { contextBridge, ipcRenderer, webUtils } = require("electron");
const path = require("path");

contextBridge.exposeInMainWorld("api", {
  read: (p) => ipcRenderer.invoke("read", p),
  write: (p, t) => ipcRenderer.invoke("write", p, t),
  open: () => ipcRenderer.invoke("open"),
  saveAs: (n) => ipcRenderer.invoke("saveAs", n),
  argv: () => ipcRenderer.invoke("argv"),
  pathOf: (file) => webUtils.getPathForFile(file),
  basename: (p) => path.basename(p),
  monacoBase:
    "file:///" +
    path.join(__dirname, "node_modules", "monaco-editor").replace(/\\/g, "/"),
});
