async function initSocialFeeds() {
  const homeFacebookEmbed = document.querySelector("[data-facebook-feature-embed]");
  const homeFacebookLink = document.querySelector("[data-facebook-feature-link]");
  const facebookHighlights = document.querySelector("[data-facebook-highlights]");
  const facebookFeedEmbed = document.querySelector("[data-facebook-feed-embed]");
  const blogFeedEmbed = document.querySelector("[data-pastor-blog-embed]");
  const blogStatus = document.querySelector("[data-pastor-blog-status]");

  if (!homeFacebookEmbed && !facebookHighlights && !blogFeedEmbed && !facebookFeedEmbed) {
    return;
  }

  try {
    const response = await fetch("./assets/data/site-content.json");
    const data = await response.json();
    const social = data.socialFeeds || {};

    const feature = social.facebookFeatured || {};
    const fbUrl = feature.videoUrl || "https://www.facebook.com/";
    const encodedFeatureUrl = encodeURIComponent(fbUrl);

    if (homeFacebookEmbed) {
      homeFacebookEmbed.src =
        "https://www.facebook.com/plugins/video.php?href=" + encodedFeatureUrl + "&show_text=true&width=560";
    }
    if (homeFacebookLink) {
      homeFacebookLink.href = fbUrl;
    }

    if (facebookFeedEmbed) {
      const groupUrl = encodeURIComponent((data.placeholders && data.placeholders.links && data.placeholders.links.facebookGroup) || "https://www.facebook.com/");
      facebookFeedEmbed.src =
        "https://www.facebook.com/plugins/page.php?href=" + groupUrl + "&tabs=timeline&width=500&height=620&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true";
    }

    if (facebookHighlights) {
      const highlights = social.facebookHighlights || [];
      facebookHighlights.innerHTML = highlights
        .map(function toItem(item) {
          return (
            '<article class="card">' +
            "<h3>" + item.title + "</h3>" +
            "<p>" + item.platform + " - " + item.date + "</p>" +
            '<p><a class="button secondary" href="' + item.url + '" target="_blank" rel="noopener noreferrer">Open</a></p>' +
            "</article>"
          );
        })
        .join("");
    }

    const blog = social.pastorBlog || {};
    if (blogFeedEmbed) {
      blogFeedEmbed.src = blog.url || "https://anthonyinspiration.com/";
    }
    if (blogStatus) {
      blogStatus.textContent = blog.statusNote || "Live blog feed is connected.";
    }
  } catch (error) {
    if (blogStatus) {
      blogStatus.textContent = "Social feed data unavailable. Please refresh.";
    }
  }
}

initSocialFeeds();
