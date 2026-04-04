async function initSocialFeeds() {
  const homeFacebookImage = document.querySelector("[data-facebook-feature-image]");
  const homeFacebookLink = document.querySelector("[data-facebook-feature-link]");
  const facebookHighlights = document.querySelector("[data-facebook-highlights]");
  const blogStatus = document.querySelector("[data-pastor-blog-status]");

  if (!homeFacebookImage && !facebookHighlights && !blogStatus && !homeFacebookLink) {
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
  } catch (error) {
    if (blogStatus) {
      blogStatus.textContent = "Social feed data unavailable. Please refresh.";
    }
  }
}

initSocialFeeds();
