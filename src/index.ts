import { app, Tray, Menu } from "electron";
import path from "path";
import { startBridge, getCurrentSong, stopBridge } from "./media";
import { initRPC, updatePresence, clearPresence } from "./rpc";

let tray: Tray | null = null;

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

app.whenReady().then(async () => {

  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, "icon.ico") // after packaging
    : path.join(__dirname, "../icon.ico");       // dev

  tray = new Tray(iconPath)

  const contextMenu = Menu.buildFromTemplate([
    { label: "Tidecord Running", enabled: false },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        stopBridge();
        app.quit();
      }
    }
  ]);

  tray.setToolTip("Tidecord");
  tray.setContextMenu(contextMenu);

  app.setLoginItemSettings({ openAtLogin: true });

  startBridge();
  await initRPC();

  setInterval(() => {
    const song = getCurrentSong();
    if (!song) return clearPresence();
    updatePresence(song);
  }, 5000);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Promise Rejection:", reason);
});