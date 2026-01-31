const ytdl = require("@distube/ytdl-core");

module.exports = async (req, res) => {
  const raw = (req.query?.id || req.query?.url || "").toString().trim();
  if (!raw) return res.status(400).send("missing id");

  const videoUrl = raw.startsWith("http") ? raw : `https://www.youtube.com/watch?v=${raw}`;

  try {
    // 1. Validasi URL
    if (!ytdl.validateURL(videoUrl)) {
      return res.status(400).send("Invalid URL");
    }

    // 2. Dapatkan Info dengan User-Agent palsu agar tidak dideteksi bot
    const info = await ytdl.getInfo(videoUrl, {
      requestOptions: {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        }
      }
    });

    // 3. Pilih format audio terbaik
    const format = ytdl.chooseFormat(info.formats, {
      quality: "highestaudio",
      filter: "audioonly",
    });

    if (!format) return res.status(404).send("No audio format found");

    // 4. Set Header agar Browser (Chrome/Android) mau memutar (PENTING!)
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Access-Control-Allow-Origin", "*"); // Izinkan semua domain akses
    res.setHeader("Transfer-Encoding", "chunked");

    // 5. Streaming
    const stream = ytdl.downloadFromInfo(info, {
      format: format,
      requestOptions: {
          headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
          }
      }
    });

    stream.pipe(res);

  } catch (e) {
    console.error("Stream Error:", e.message);
    res.status(500).send(e.message);
  }
};
