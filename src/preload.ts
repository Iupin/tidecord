import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  onSongUpdate: (callback: (song: any) => void) => {
    ipcRenderer.on("song-update", (_, data) => callback(data));
  },
  hideWindow: () => ipcRenderer.send("hide-window"),
  setSendRPC: (enabled: boolean) => ipcRenderer.send("set-send-rpc", enabled)
});