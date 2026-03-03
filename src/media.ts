import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import path from "path";

export interface Song {
  title: string;
  artist: string;
  duration: number;
  position: number;
  paused: boolean;
}

let latestSong: Song | null = null;
let bridgeProcess: ChildProcessWithoutNullStreams | null = null;

export function startBridge(): void {
  const bridgePath = path.join(__dirname, "../bridge/MediaBridge.exe");
  bridgeProcess = spawn(bridgePath);

  bridgeProcess.stdout.on("data", (data) => {
    const lines = data.toString().split("\n").filter(Boolean);
    for (const line of lines) {
      try {
        latestSong = JSON.parse(line);
      } catch {}
    }
  });

  bridgeProcess.stderr.on("data", (err) => console.error("Bridge error:", err.toString()));
}

export function getCurrentSong(): Song | null {
  return latestSong;
}

export function stopBridge(): void {
  if (bridgeProcess) bridgeProcess.kill();
}