/**
 * Identifies a file by its real first bytes, ignoring the name and the type the browser
 * claims. This stops scripts or other files being uploaded disguised as pictures/videos.
 */
export type SniffedFile = { mime: string; ext: string; kind: "image" | "video" };

export function sniffMedia(buf: Buffer): SniffedFile | null {
  const ascii = (a: number, b: number) => buf.subarray(a, b).toString("latin1");
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: "image/jpeg", ext: "jpg", kind: "image" };
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: "image/png", ext: "png", kind: "image" };
  if (buf.length > 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { mime: "image/webp", ext: "webp", kind: "image" };
  if (buf.length > 6 && (ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a")) return { mime: "image/gif", ext: "gif", kind: "image" };
  if (buf.length > 12 && ascii(4, 8) === "ftyp") {
    const brand = ascii(8, 12);
    if (brand === "avif" || brand === "avis") return { mime: "image/avif", ext: "avif", kind: "image" };
    if (brand === "qt  ") return { mime: "video/quicktime", ext: "mov", kind: "video" };
    return { mime: "video/mp4", ext: "mp4", kind: "video" }; // isom, mp42, M4V, etc.
  }
  if (buf.length > 4 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return { mime: "video/webm", ext: "webm", kind: "video" };
  return null;
}
