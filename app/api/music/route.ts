import { readdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { isAudioBasename } from "@/components/audio/audio-file.constants";

export async function GET() {
  const dir = path.join(process.cwd(), "public", "music");
  let names: string[] = [];
  try {
    names = await readdir(dir);
  } catch {
    return NextResponse.json({ tracks: [] satisfies { url: string; label: string }[] });
  }

  const audioFiles = names
    .filter((name) => isAudioBasename(name))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  const tracks = audioFiles.map((name) => ({
    url: `/music/${encodeURIComponent(name)}`,
    label: name,
  }));

  return NextResponse.json({ tracks });
}
