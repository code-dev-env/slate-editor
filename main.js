const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const fs = require("fs");
const path = require("path");

let win;
let confirmed = false;

function createWindow() {
  win = new BrowserWindow({
    width: 1100,
    height: 750,
    autoHideMenuBar: true,
    show: false,
    title: "Slate Editor",
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: {
      sandbox: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });
  win.removeMenu();
  win.loadFile("index.html");
  win.once("ready-to-show", () => win.show());
  win.on("close", (e) => {
    if (confirmed) return;
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
      confirmed = true;
      win.close();
    }
  });
}

ipcMain.handle("read", (_, p) => fs.readFileSync(p, "utf8"));
ipcMain.handle("write", (_, p, text) => {
  fs.writeFileSync(p, text, "utf8");
  return true;
});
ipcMain.handle("open", async () => {
  const r = await dialog.showOpenDialog(win, {
    properties: ["openFile", "multiSelections"],
  });
  return r.canceled ? [] : r.filePaths;
});
ipcMain.handle("saveAs", async (_, name) => {
  const r = await dialog.showSaveDialog(win, { defaultPath: name });
  return r.canceled ? null : r.filePath;
});
ipcMain.handle("argv", () =>
  process.argv
    .slice(app.isPackaged ? 1 : 2)
    .filter((a) => !a.startsWith("-") && fs.existsSync(a)),
);

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
