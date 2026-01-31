// api/search.js
const yts = require("yt-search");

module.exports = async (req, res) => {
  const query = req.query.q;

  try {
    if (!query) {
      // Jika tidak ada query, kembalikan rekomendasi "Top Hits"
      const r = await yts("Top global music hits");
      return res.json(r.videos.slice(0, 10));
    }

    // Cari lagu berdasarkan query
    const r = await yts(query);
    const videos = r.videos.slice(0, 15).map(v => ({
      title: v.title,
      videoId: v.videoId,
      timestamp: v.timestamp,
      author: v.author.name,
      thumbnail: v.thumbnail,
      url: v.url
    }));

    res.json(videos);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
