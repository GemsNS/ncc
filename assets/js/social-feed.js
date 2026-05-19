async function initSocialFeeds() {
  const homeFacebookImage = document.querySelector("[data-facebook-feature-image]");
  const homeFacebookLink = document.querySelector("[data-facebook-feature-link]");
  const facebookHighlights = document.querySelector("[data-facebook-highlights]");
  const blogStatus = document.querySelector("[data-pastor-blog-status]");
  const pastorBlogLinks = document.querySelectorAll("[data-pastor-blog-link]");
  const pastorBlogEmbed = document.querySelector("[data-pastor-blog-embed]");
  const anthonyAbout = document.querySelector("[data-anthony-about-copy]");
  const anthonyQuote = document.querySelector("[data-anthony-quote]");
  const anthonyBookTitle = document.querySelector("[data-anthony-book-title]");
  const anthonyBookCopy = document.querySelector("[data-anthony-book-copy]");
  const anthonyBooksLink = document.querySelector("[data-anthony-books-link]");
  const anthonyBlogTitle = document.querySelector("[data-anthony-blog-title]");
  const anthonyBlogSnippet = document.querySelector("[data-anthony-blog-snippet]");
  const anthonyBlogLink = document.querySelector("[data-anthony-blog-link]");
  const anthonySections = document.querySelector("[data-anthony-site-sections]");
  const anthonyHomeFeed = document.querySelector("[data-anthony-home-feed]");
  const anthonyPageLinks = document.querySelectorAll("[data-anthony-page-link]");
  const anthonyYoutubeLinks = document.querySelectorAll("[data-anthony-youtube-link]");
  const anthonyYoutubeTitle = document.querySelector("[data-anthony-youtube-title]");
  const anthonyYoutubeSummary = document.querySelector("[data-anthony-youtube-summary]");
  const wellnessLinks = document.querySelectorAll("[data-wellness-stream-link]");
  const anthonyLiveEmbed = document.querySelector("[data-anthony-live-embed]");
  const wellnessEmbed = document.querySelector("[data-wellness-embed]");

  if (
    !homeFacebookImage &&
    !facebookHighlights &&
    !blogStatus &&
    !homeFacebookLink &&
    !pastorBlogLinks.length &&
    !pastorBlogEmbed &&
    !anthonyAbout &&
    !anthonyQuote &&
    !anthonyBookTitle &&
    !anthonyBookCopy &&
    !anthonyBooksLink &&
    !anthonyBlogTitle &&
    !anthonyBlogSnippet &&
    !anthonyBlogLink &&
    !anthonySections &&
    !anthonyHomeFeed &&
    !anthonyPageLinks.length &&
    !anthonyYoutubeLinks.length &&
    !anthonyYoutubeTitle &&
    !anthonyYoutubeSummary &&
    !wellnessLinks.length &&
    !anthonyLiveEmbed &&
    !wellnessEmbed
  ) {
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
    const blogUrl = blog.url || "https://anthonyinspiration.com/";
    const blogEmbedUrl = blog.embedUrl || blogUrl;
    pastorBlogLinks.forEach(function (link) {
      link.href = blogUrl;
    });
    if (pastorBlogEmbed) {
      pastorBlogEmbed.src = blogEmbedUrl;
    }

    const website = social.anthonyWebsite || {};
    if (anthonyAbout) {
      anthonyAbout.textContent = website.aboutSummary || anthonyAbout.textContent;
    }
    if (anthonyQuote) {
      anthonyQuote.textContent = website.quote ? '"' + website.quote + '" - Anthony VanDyke' : anthonyQuote.textContent;
    }
    if (anthonyBookTitle) {
      anthonyBookTitle.textContent = website.bookTitle || anthonyBookTitle.textContent;
    }
    if (anthonyBookCopy) {
      anthonyBookCopy.textContent = website.bookSummary || anthonyBookCopy.textContent;
    }
    if (anthonyBooksLink) {
      anthonyBooksLink.href = website.booksUrl || blogUrl;
    }
    if (anthonyBlogTitle) {
      anthonyBlogTitle.textContent = website.latestBlogTitle || anthonyBlogTitle.textContent;
    }
    if (anthonyBlogSnippet) {
      anthonyBlogSnippet.textContent = website.latestBlogSnippet || anthonyBlogSnippet.textContent;
    }
    if (anthonyBlogLink) {
      anthonyBlogLink.href = website.blogUrl || blogUrl;
    }
    if (anthonySections) {
      const sections = Array.isArray(website.sections) ? website.sections : [];
      if (sections.length) {
        anthonySections.innerHTML = sections
          .map(function (item) {
            return '<li class="section-chip">' + item + "</li>";
          })
          .join("");
      }
    }
    if (anthonyHomeFeed) {
      const posts = Array.isArray(website.latestPosts) ? website.latestPosts : [];
      if (posts.length) {
        anthonyHomeFeed.innerHTML = posts
          .map(function (item) {
            const type = item.type ? '<span class="pill">' + item.type + "</span>" : "";
            return (
              '<article class="card">' +
              type +
              "<h3>" + (item.title || "Update") + "</h3>" +
              "<p>" + (item.summary || "New content available.") + "</p>" +
              '<p><a class="button secondary" href="' + (item.url || blogUrl) + '" target="_blank" rel="noopener noreferrer">Read More</a></p>' +
              "</article>"
            );
          })
          .join("");
      }
    }

    const youtube = social.anthonyYouTube || {};
    const youtubeUrl = youtube.channelUrl || "https://www.youtube.com/@AnthonyMVanDyke";
    anthonyYoutubeLinks.forEach(function (link) {
      link.href = youtubeUrl;
    });
    if (anthonyYoutubeTitle) {
      anthonyYoutubeTitle.textContent = youtube.title || "YouTube";
    }
    if (anthonyYoutubeSummary) {
      anthonyYoutubeSummary.textContent =
        youtube.summary || "Watch teaching and encouragement on the Anthony M. VanDyke channel.";
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
