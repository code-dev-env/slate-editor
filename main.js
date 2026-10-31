const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  nativeTheme,
} = require("electron");
const fs = require("fs");
const path = require("path");

const initialFiles = new Map(); // webContents id -> files this window should open
const confirmed = new WeakSet(); // windows the user already agreed to close
const hasWork = new Map(); // webContents id -> window has opened files or edits

function createWindow(files = []) {
  const win = new BrowserWindow({
    width: 1100,
    height: 750,
    autoHideMenuBar: true,
    show: false,
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#1e1e1e" : "#ffffff",
    title: "Slate Editor",
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: {
      sandbox: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });
  const id = win.webContents.id;
  initialFiles.set(id, files);
  win.removeMenu();
  win.loadFile("index.html");
  win.once("ready-to-show", () => win.show());
  win.on("closed", () => {
    initialFiles.delete(id);
    hasWork.delete(id);
  });
  win.on("close", (e) => {
    // A fresh, empty untitled tab has nothing to lose, so close without asking.
    if (confirmed.has(win) || !hasWork.get(id)) return;
    e.preventDefault();
    const r = dialog.showMessageBoxSync(win, {
      type: "question",
      buttons: ["Yes", "No"],
      defaultId: 1,
      cancelId: 1,
      title: "Slate Editor",
      message: "Close the editor?",
      detail: "Any unsaved changes will be lost.",
    });
    if (r === 0) {
      confirmed.add(win);
      win.close();
    }
  });
}

ipcMain.on("hasWork", (e, v) => hasWork.set(e.sender.id, !!v));

const winOf = (e) => BrowserWindow.fromWebContents(e.sender);

ipcMain.handle("read", (_, p) => fs.promises.readFile(p, "utf8"));
ipcMain.handle("write", async (_, p, text) => {
  await fs.promises.writeFile(p, text, "utf8");
  return true;
});
ipcMain.handle("open", async (e) => {
  const r = await dialog.showOpenDialog(winOf(e), {
    properties: ["openFile", "multiSelections"],
  });
  return r.canceled ? [] : r.filePaths;
});
ipcMain.handle("saveAs", async (e, name) => {
  const r = await dialog.showSaveDialog(winOf(e), { defaultPath: name });
  return r.canceled ? null : r.filePath;
});

const filePaths = (argv) =>
  argv
    .slice(app.isPackaged ? 1 : 2)
    .filter((a) => !a.startsWith("-") && fs.existsSync(a));
ipcMain.handle("argv", (e) => initialFiles.get(e.sender.id) || []);

// Every launch is a new window in this one process, so all windows share the
// same saved settings (theme etc.). A second process can't use the profile folder.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", (_, argv) => createWindow(filePaths(argv)));
  app.whenReady().then(() => createWindow(filePaths(process.argv)));
}
app.on("window-all-closed", () => app.quit());
