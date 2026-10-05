function getYouTubeEmbedUrl(url) {
  if (!url) return "";

  try {
    const raw = String(url).trim();

    const parsed = new URL(raw);

    const hostname = parsed.hostname
      .toLowerCase()
      .replace(/^www\./, "");

    let videoId = "";

    // youtube.com / m.youtube.com
    if (
      hostname === "youtube.com" ||
      hostname === "m.youtube.com"
    ) {
      // watch?v=VIDEO_ID
      videoId =
        parsed.searchParams.get("v") || "";

      // /live/VIDEO_ID
      if (
        !videoId &&
        parsed.pathname.startsWith("/live/")
      ) {
        videoId =
          parsed.pathname
            .split("/live/")[1]
            ?.split("/")[0] || "";
      }

      // /embed/VIDEO_ID
      if (
        !videoId &&
        parsed.pathname.startsWith("/embed/")
      ) {
        videoId =
          parsed.pathname
            .split("/embed/")[1]
            ?.split("/")[0] || "";
      }

      // /shorts/VIDEO_ID
      if (
        !videoId &&
        parsed.pathname.startsWith("/shorts/")
      ) {
        videoId =
          parsed.pathname
            .split("/shorts/")[1]
            ?.split("/")[0] || "";
      }
    }

    // youtu.be/VIDEO_ID
    if (hostname === "youtu.be") {
      videoId =
        parsed.pathname
          .replace(/^\/+/, "")
          .split("/")[0] || "";
    }

    if (!videoId) {
      console.warn(
        "YouTube video ID नहीं मिला:",
        raw
      );
      return "";
    }

    return (
      "https://www.youtube.com/embed/" +
      encodeURIComponent(videoId) +
      "?rel=0&playsinline=1"
    );

  } catch (error) {

    console.error(
      "YouTube URL error:",
      error
    );

    return "";
  }
}
