import RPC from "discord-rpc";
import { Song } from "./media";

const CLIENT_ID = "1478438671689449694";

export const rpc = new RPC.Client({ transport: "ipc" });
rpc.on("ready", () => console.log("RPC ready"));
rpc.on("disconnected", () => console.log("RPC disconnected"));
rpc.on("error", (e) => console.error("RPC error:", e));

export async function initRPC(): Promise<void> {
  await rpc.login({ clientId: CLIENT_ID });
}

export function clearPresence(): void {
  rpc.clearActivity();
}

export function updatePresence(song: Song): void {
  console.log("Updating presence")
  const now = Date.now();
  const start = now - song.position;
  const end = start + song.duration;

  if (!song.title || song.title === "TIDAL") {
    // Default status when no song is playing
    rpc.setActivity({
      details: "TIDAL is open",
      state: "Idle",
      largeImageKey: "tidal",
      largeImageText: "TIDAL",
    });
    return;
  }

  rpc.setActivity({
    details: song.title,
    state: `by ${song.artist}`,
    startTimestamp: start,
    endTimestamp: end,
    largeImageKey: "tidal",
    largeImageText: "Listening on TIDAL",
  });
}