async function initSocialFeeds() {
  const homeFacebookImage = document.querySelector("[data-facebook-feature-image]");
  const homeFacebookLink = document.querySelector("[data-facebook-feature-link]");
  const facebookHighlights = document.querySelector("[data-facebook-highlights]");
  const blogStatus = document.querySelector("[data-pastor-blog-status]");
  const anthonyPageLinks = document.querySelectorAll("[data-anthony-page-link]");
  const wellnessLinks = document.querySelectorAll("[data-wellness-stream-link]");
  const anthonyLiveEmbed = document.querySelector("[data-anthony-live-embed]");
  const wellnessEmbed = document.querySelector("[data-wellness-embed]");

  if (!homeFacebookImage && !facebookHighlights && !blogStatus && !homeFacebookLink && !anthonyPageLinks.length && !wellnessLinks.length && !anthonyLiveEmbed && !wellnessEmbed) {
    return;
  }

  try {
    const response = await fetch("./assets/data/site-content.json");
    const data = await response.json();
    const social = data.socialFeeds || {};

    const feature = social.facebookFeatured || {};
    const fbUrl = feature.videoUrl || "https://www.facebook.com/";

    if (homeFacebookImage) {
      homeFacebookImage.src = feature.thumbnail || homeFacebookImage.src;
    }
    if (homeFacebookLink) {
      homeFacebookLink.href = fbUrl;
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
    if (blogStatus) {
      blogStatus.textContent = blog.statusNote || "Live blog feed is connected.";
    }

    const anthony = social.anthonyFacebook || {};
    const anthonyPageUrl = anthony.pageUrl || "https://www.facebook.com/anthony.vandyke.3";
    const pageEmbedUrl =
      "https://www.facebook.com/plugins/page.php?href=" +
      encodeURIComponent(anthonyPageUrl) +
      "&tabs=timeline&width=500&height=680&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId";

    anthonyPageLinks.forEach(function (link) {
      link.href = anthonyPageUrl;
    });

    if (anthonyLiveEmbed) {
      anthonyLiveEmbed.src = anthony.pageEmbedUrl || pageEmbedUrl;
    }

    const wellness = social.wednesdayWellnessWalk || {};
    const wellnessUrl = wellness.streamUrl || anthonyPageUrl;
    const videoEmbedUrl =
      "https://www.facebook.com/plugins/video.php?href=" +
      encodeURIComponent(wellnessUrl) +
      "&show_text=false&width=560";

    wellnessLinks.forEach(function (link) {
      link.href = wellnessUrl;
    });

    if (wellnessEmbed) {
      wellnessEmbed.src = wellness.embedUrl || videoEmbedUrl;
    }
  } catch (error) {
    if (blogStatus) {
      blogStatus.textContent = "Social feed data unavailable. Please refresh.";
    }
  }
}

initSocialFeeds();
