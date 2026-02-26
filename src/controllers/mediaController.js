const path = require("path");
const fs = require("fs");
const { respond } = require("../helpers/response");
const sharp = require("sharp");

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

		if (type !== "image") {
			return respond(res, 400, "Unsupported media type", []);
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

		// Optional resize
		const w = parseInt(req.query.w, 10);
		const h = parseInt(req.query.h, 10);
		const shouldResize =
			Number.isFinite(w) && w > 0 || Number.isFinite(h) && h > 0;

		// Set mime type based on extension; fallback to application/octet-stream
		const ext = path.extname(absPath).toLowerCase();
		const mimeMap = {
			".jpg": "image/jpeg",
			".jpeg": "image/jpeg",
			".png": "image/png",
			".gif": "image/gif",
			".webp": "image/webp",
			".bmp": "image/bmp",
			".svg": "image/svg+xml",
		};
		const mime = mimeMap[ext] || "application/octet-stream";
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

		return stream.on("error", (e) => {
			console.error("sharp error:", e.message);
			return respond(res, 500, "Failed to process image", []);
		}).pipe(res);
	} catch (err) {
		console.error("getMedia error:", err.message);
		return respond(res, 500, "Failed to fetch media", []);
	}
};
