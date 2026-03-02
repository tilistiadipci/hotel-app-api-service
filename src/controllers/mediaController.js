const path = require("path");
const fs = require("fs");
const { respond } = require("../helpers/response");
const sharp = require("sharp");
const Media = require("../models/mediaModel");

const baseDir = process.env.MEDIA_STORAGE_PATH;

// GET /api/media?type=image&path=images/movies/sample_cover.jpg
exports.getMedia = async (req, res) => {
  try {
    if (!baseDir) {
      return respond(res, 500, "MEDIA_STORAGE_PATH not configured", []);
    }

    const { type, path: relPathRaw } = req.query;

    if (!type || !relPathRaw) {
      return respond(res, 400, "type and path are required", []);
    }

    // Normalize and strip traversal attempts
    const normalizedRel = path
      .normalize(relPathRaw)
      .replace(/^(\.\.[/\\])+/, "")
      .replace(/^[/\\]+/, "");

    const absPath = path.resolve(baseDir, normalizedRel);

    // prevent path traversal outside base dir
    if (!absPath.startsWith(path.resolve(baseDir))) {
      return respond(res, 403, "Forbidden", []);
    }

    if (!fs.existsSync(absPath)) {
      return respond(res, 404, "File not found", []);
    }

    const ext = path.extname(absPath).toLowerCase();
    const mimeMap = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".bmp": "image/bmp",
      ".svg": "image/svg+xml",
      ".mp4": "video/mp4",
      ".mkv": "video/x-matroska",
      ".webm": "video/webm",
      ".mov": "video/mp4",
      ".mp3": "audio/mpeg",
      ".wav": "audio/wav",
      ".m4a": "audio/mp4",
      ".aac": "audio/aac",
      ".ogg": "audio/ogg",
    };
    const mime = mimeMap[ext] || "application/octet-stream";

    if (type === "image") {
      // Optional resize
      const w = parseInt(req.query.w, 10);
      const h = parseInt(req.query.h, 10);
      const shouldResize =
        (Number.isFinite(w) && w > 0) || (Number.isFinite(h) && h > 0);

      res.type(mime);

      if (!shouldResize || mime === "image/svg+xml") {
        return res.sendFile(absPath);
      }

      const stream = sharp(absPath).resize({
        width: Number.isFinite(w) && w > 0 ? w : null,
        height: Number.isFinite(h) && h > 0 ? h : null,
        fit: "inside",
      });

      // Preserve original format
      switch (mime) {
        case "image/png":
          stream.png();
          break;
        case "image/webp":
          stream.webp();
          break;
        default:
          stream.jpeg();
      }

      return stream
        .on("error", (e) => {
          console.error("sharp error:", e.message);
          return respond(res, 500, "Failed to process image", []);
        })
        .pipe(res);
    }

    if (type === "video" || type === "audio") {
      const stat = fs.statSync(absPath);
      const fileSize = stat.size;
      const range = req.headers.range;

      const logStreamProgress = (stream, ctx) => {
        let chunkIdx = 0;
        let totalBytes = 0;
        stream.on("data", (chunk) => {
          chunkIdx += 1;
          totalBytes += chunk.length;
          console.log(
            `[media:${type}] chunk ${chunkIdx} (${chunk.length} bytes) total=${totalBytes} bytes ${ctx}`
          );
        });
        stream.on("end", () => {
          console.log(`[media:${type}] stream finished ${ctx}, sent=${totalBytes} bytes`);
        });
        stream.on("error", (e) => {
          console.error(`[media:${type}] stream error ${ctx}:`, e.message);
        });
      };

      if (range) {
        const matches = /bytes=(\d+)-(\d*)/.exec(range);
        if (!matches) {
          return res.status(416).set({ "Accept-Ranges": "bytes" }).end();
        }

        const start = parseInt(matches[1], 10);
        const end = matches[2] ? parseInt(matches[2], 10) : fileSize - 1;

        if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= fileSize) {
          return res.status(416).set({ "Accept-Ranges": "bytes" }).end();
        }

        const chunkSize = end - start + 1;
        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize,
          "Content-Type": mime,
          "Content-Disposition": `inline; filename="${path.basename(absPath)}"`,
        });
        const stream = fs.createReadStream(absPath, { start, end });
        logStreamProgress(stream, `range=${start}-${end}/${fileSize}`);
        return stream.pipe(res);
      }

      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": mime,
        "Accept-Ranges": "bytes",
        "Content-Disposition": `inline; filename="${path.basename(absPath)}"`,
      });
      const stream = fs.createReadStream(absPath);
      logStreamProgress(stream, `full=0-${fileSize - 1}/${fileSize}`);
      return stream.pipe(res);
    }

    return respond(res, 400, "Unsupported media type", []);
  } catch (err) {
    console.error("getMedia error:", err.message);
    return respond(res, 500, "Failed to fetch media", []);
  }
};

// GET /api/media/all?type=image&category=poster&active=1&q=marvel
exports.getAllMedia = async (req, res) => {
  try {
    const { type, category } = req.query;
    const rawActive = req.query.active;
    const q = req.query.q || req.query.search || "";

    const filters = {
      type: type ? String(type).trim() : undefined,
      category: category ? String(category).trim() : undefined,
      isActive:
        rawActive === undefined
          ? undefined
          : ["1", "true", "yes", "on"].includes(String(rawActive).toLowerCase()),
      q: q ? String(q).trim() : undefined,
    };

    const media = await Media.list(filters);
    return respond(res, 200, "success", media, "Media list");
  } catch (err) {
    console.error("getAllMedia error:", err.message);
    return respond(res, 500, "Failed to fetch media list", []);
  }
};
