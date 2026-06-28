import { NextResponse } from "next/server";

const sourceUrl = "https://www.yymp3.com/top/fzlgq.htm";

const fallbackTracks = [
  { title: "犯贱", artist: "徐良 / 阿悄", url: sourceUrl },
  { title: "你的心跳", artist: "非主流榜单", url: sourceUrl },
  { title: "泪鱼", artist: "非主流榜单", url: sourceUrl },
  { title: "客官不可以", artist: "徐良 / 小凌", url: sourceUrl },
  { title: "最后是我开了口", artist: "小贱", url: sourceUrl },
  { title: "卑恋", artist: "林希儿", url: sourceUrl },
  { title: "和平分手", artist: "徐良 / 小暖", url: sourceUrl },
  { title: "附送折磨", artist: "本兮", url: sourceUrl },
];

function decodeHtml(buffer: ArrayBuffer) {
  const utf8 = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  const charset = utf8.match(/charset=["']?([\w-]+)/i)?.[1]?.toLowerCase();
  if (charset && charset !== "utf-8") {
    try {
      return new TextDecoder(charset, { fatal: false }).decode(buffer);
    } catch {
      return utf8;
    }
  }
  return utf8;
}

function cleanText(value: string) {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function parseTracks(html: string) {
  const tracks: typeof fallbackTracks = [];
  const seen = new Set<string>();
  const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorPattern.exec(html)) && tracks.length < 24) {
    const href = match[1];
    const title = cleanText(match[2]);
    const looksLikeSong = /\/Play\/\d+\/\d+\.htm/i.test(href);
    const usefulTitle = title.length >= 2 && title.length <= 36 && !/[首页搜索专辑歌手排行繁體中文更多]/.test(title);
    if (!looksLikeSong || !usefulTitle || seen.has(title)) continue;
    seen.add(title);
    tracks.push({
      title,
      artist: "YYMP3 非主流榜",
      url: href.startsWith("http") ? href : new URL(href, sourceUrl).toString(),
    });
  }

  return tracks;
}

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(sourceUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 ZangAI Winamp/2009",
      },
      cache: "no-store",
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`YYMP3 ${response.status}`);
    const html = decodeHtml(await response.arrayBuffer());
    const tracks = parseTracks(html);

    return NextResponse.json({
      ok: true,
      source: sourceUrl,
      fromFallback: tracks.length === 0,
      tracks: tracks.length ? tracks : fallbackTracks,
    });
  } catch {
    return NextResponse.json({
      ok: true,
      source: sourceUrl,
      fromFallback: true,
      tracks: fallbackTracks,
    });
  }
}
