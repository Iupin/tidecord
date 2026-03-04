import { app, Tray, Menu, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { startBridge, getCurrentSong, stopBridge } from "./media";
import { initRPC, updatePresence, clearPresence } from "./rpc";
import { Song } from "./media";

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

function createWindow() {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 520,
    height: 320,
    resizable: false,
    frame: false,
    transparent: true,
    hasShadow: true,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    }
  });

  mainWindow.loadFile(path.join(__dirname, "renderer.html"));

  ipcMain.on("hide-window", () => {
    mainWindow?.hide();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}


app.whenReady().then(async () => {

  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, "icon.ico") // after packaging
    : path.join(__dirname, "../icon.ico");       // dev

  tray = new Tray(iconPath)

  function updateTray(song: Song) {
    const statusLabel = song.title == "TIDAL"
      ? `Idle`
      : `Playing: ${song.title}`

    const contextMenu = Menu.buildFromTemplate([
      { label: `Tidecord - ${statusLabel}`, enabled: false },
      { type: "separator" },
      {
        label: "Open Dashboard",
        click: () => createWindow()
      },
      {
        label: "Quit",
          click: () => {
          stopBridge();
          app.quit();
        }
      }
    ]);
    tray?.setToolTip("Tidecord");
    tray?.setContextMenu(contextMenu);
  }

  app.setLoginItemSettings({ openAtLogin: true });

  startBridge();
  await initRPC();

  setInterval(() => {
    const song = getCurrentSong();
    if (!song) {
      clearPresence();
      mainWindow?.webContents.send("song-update", null);
      return
    }


    mainWindow?.webContents.send("song-update", song)
    

    updatePresence(song);
    updateTray(song)
  }, 5000);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Promise Rejection:", reason);
});