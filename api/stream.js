// api/stream.js
const ytdl = require("@distube/ytdl-core");

module.exports = async (req, res) => {
  // Ambil ID atau URL dari query
  const raw = (req.query?.id || req.query?.url || "").toString().trim();
  if (!raw) return res.status(400).send("missing id/url");

  // Logika URL handling (sesuai kode asli Anda)
  // Jika raw adalah ID (tidak ada http), kita buat jadi URL youtube standar agar ytdl bisa membacanya dengan aman,
  // atau biarkan kode asli Anda yang menangani format googleusercontent jika itu preferensi Anda.
  // Di sini saya memastikannya menjadi URL yang valid untuk ytdl.
  const videoUrl = raw.startsWith("http")
    ? raw
    : `https://www.youtube.com/watch?v=${raw}`; 

  try {
    if (!ytdl.validateURL(videoUrl)) {
      return res.status(400).send("invalid youtube url/id");
    }

    const info = await ytdl.getInfo(videoUrl, {
      requestOptions: {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
      },
    });

    const format = ytdl.chooseFormat(info.formats, {
      quality: "highestaudio",
      filter: "audioonly",
    });

    if (!format || !format.url) {
      return res.status(404).send("no audio format");
    }

    const mimeType = (format.mimeType || "audio/mp4").split(";")[0];

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Cache-Control", "public, max-age=3600"); // Cache agar lebih cepat
    res.setHeader("Accept-Ranges", "bytes");

    const range = req.headers.range;
    if (range) res.statusCode = 206;

    const stream = ytdl(videoUrl, {
      quality: "highestaudio",
      filter: "audioonly",
      format,
      highWaterMark: 1 << 25,
      requestOptions: {
        headers: {
          ...(range ? { Range: range } : {}),
        },
      },
    });

    req.on("close", () => stream.destroy());

    stream.on("error", (e) => {
      console.error("ytdl stream error:", e);
      if (!res.headersSent) res.status(500).end("stream error");
    });

    stream.pipe(res);
  } catch (e) {
    console.error("stream error:", e);
    res.status(500).send("blocked / stream failed");
  }
};
