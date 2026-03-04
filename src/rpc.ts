import { Client, StatusDisplayType } from "@xhayper/discord-rpc";
import { ActivityType } from "discord-api-types/v10";
import { Song } from "./media";

const CLIENT_ID = "1478438671689449694";

export const rpc = new Client({ clientId: CLIENT_ID });
rpc.on("ready", () => console.log("RPC ready"));
rpc.on("disconnected", () => console.log("RPC disconnected"));
rpc.on("error", (e) => console.error("RPC error:", e));

export async function initRPC(): Promise<void> {
  await rpc.login();
}

export async function clearPresence(): Promise<void> {
  if (!rpc.user) {
    console.log("RPC not ready yet, skipping presence clear");
    return;
  }

  await rpc.user.clearActivity();
}

export async function updatePresence(song: Song): Promise<void> {
  console.log("Updating presence")
  const now = Date.now();
  const start = now - song.position;
  const end = start + song.duration;

  if (!rpc.user) {
    console.log("RPC not ready yet, skipping presence update");
    return;
  }

  if (!song.title || song.title === "TIDAL") {
    // Default status when no song is playing
    await rpc.user.setActivity({
      details: "TIDAL is open",
      state: "Idle",
      largeImageKey: "tidal",
      largeImageText: "TIDAL",
      type: ActivityType.Playing,
      statusDisplayType: StatusDisplayType.NAME
    });
    return;
  }

  await rpc.user.setActivity({
    details: song.title,
    state: `by ${song.artist}`,
    startTimestamp: start,
    endTimestamp: end,
    largeImageKey: "tidal",
    largeImageText: "Listening on TIDAL",
    type: ActivityType.Listening,
    statusDisplayType: StatusDisplayType.DETAILS
  });
}