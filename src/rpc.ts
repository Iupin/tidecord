import RPC from "discord-rpc";
import { Song } from "./media";

const CLIENT_ID = "1478438671689449694";

export const rpc = new RPC.Client({ transport: "ipc" });

export async function initRPC(): Promise<void> {
  await rpc.login({ clientId: CLIENT_ID });
}

export function clearPresence(): void {
  rpc.clearActivity();
}

export function updatePresence(song: Song): void {
  const now = Date.now();
  const start = now - song.position;
  const end = start + song.duration;

  if (song.paused) {
    rpc.setActivity({
      details: song.title,
      state: song.artist,
      largeImageKey: "tidal",
      largeImageText: "Paused on TIDAL"
    });
  } else {
    rpc.setActivity({
      details: song.title,
      state: song.artist,
      startTimestamp: start,
      endTimestamp: end,
      largeImageKey: "tidal",
      largeImageText: "Listening on TIDAL"
    });
  }
}