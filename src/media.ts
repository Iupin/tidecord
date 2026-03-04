import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import { app } from "electron";
import path from "path";
import fs from "fs";

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
  console.log(`Starting bridge`);
  const bridgePath = app.isPackaged
    ? path.join(process.resourcesPath, "bridge", "MediaBridge.exe")
    : path.resolve(__dirname, "../bridge/MediaBridge.exe");

  if (!fs.existsSync(bridgePath)) {
    console.error("Bridge exe not found!");
    process.exit(1);
  }

  bridgeProcess = spawn(bridgePath, {
    shell: true,  // Important on Windows
    stdio: ['pipe', 'pipe', 'pipe']
  });

  bridgeProcess.stdout.on("data", (data: Buffer) => {
    const lines = data.toString().split("\n").map(l => l.trim()).filter(Boolean);
    console.log(lines)
    for (const line of lines) {
      try {
        latestSong = JSON.parse(line);
      } catch (err) {
        console.error("Failed to parse JSON from bridge:", line, err);
      }
    }
  });

  bridgeProcess.stderr.on("data", (err: Buffer) => console.error("Bridge Error:", err.toString()));

  bridgeProcess.on("exit", (code) => {
    console.warn(`Bridge exited with code ${code}. Restarting in 1s...`);
    latestSong = null;
    setTimeout(startBridge, 1000);
  });
}

export function getCurrentSong(): Song | null {
  return latestSong;
}

export function stopBridge(): void {
  if (bridgeProcess) {
    bridgeProcess.kill();
    bridgeProcess = null;
  }
}