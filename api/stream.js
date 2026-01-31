const ytdl = require("@distube/ytdl-core");

module.exports = async (req, res) => {
  const raw = (req.query?.id || req.query?.url || "").toString().trim();
  if (!raw) return res.status(400).send("missing id");

  const videoUrl = raw.startsWith("http") ? raw : `https://www.youtube.com/watch?v=${raw}`;

  try {
    // Validasi dasar
    if (!ytdl.validateURL(videoUrl)) {
      return res.status(400).send("invalid youtube url");
    }

    // --- STRATEGI BARU: Menggunakan Agent Khusus ---
    // Kita membuat ytdl 'berpura-pura' menjadi browser Android
    const agentOptions = {
      requestOptions: {
        headers: {
          // User Agent Android agar YouTube tidak curiga
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
          "Accept": "*/*",
          "Accept-Language": "en-US,en;q=0.9",
          "Referer": "https://www.youtube.com/",
        }
      }
    };

    // 1. Ambil Info Video
    const info = await ytdl.getInfo(videoUrl, agentOptions);

    // 2. Pilih Format Audio
    const format = ytdl.chooseFormat(info.formats, {
      quality: "highestaudio",
      filter: "audioonly",
    });

    if (!format || !format.url) {
      return res.status(404).send("no audio format found");
    }

    // --- PENTING: Header untuk Browser ---
    res.setHeader("Content-Type", "audio/mpeg");
    // Mengizinkan browser memutar dari domain lain
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

    // 3. Teknik Stream: Langsung redirect jika memungkinkan, atau Pipe
    // Kita gunakan teknik 'downloadFromInfo' dengan opsi highWaterMark besar
    // agar buffer lebih lancar di Vercel
    const stream = ytdl.downloadFromInfo(info, {
      format: format,
      highWaterMark: 1 << 25, // Buffer besar
      requestOptions: agentOptions.requestOptions // Gunakan header yang sama
    });

    stream.on("error", (err) => {
      console.error("Stream Error:", err);
      if (!res.headersSent) {
        res.status(500).send("Streaming failed on server");
      }
    });

    stream.pipe(res);

  } catch (e) {
    console.error("Backend Error:", e.message);
    res.status(500).send("Gagal memutar. YouTube memblokir IP ini.");
  }
};
