async function initSharefaithGiving() {
  const methodsNode = document.querySelector("[data-sharefaith-methods]");
  const platformNode = document.querySelector("[data-sharefaith-platform]");
  const testimonialsNode = document.querySelector("[data-sharefaith-testimonials]");
  if (!methodsNode && !platformNode && !testimonialsNode) {
    return;
  }

  try {
    const [platformRes, methodsRes, testimonialsRes] = await Promise.all([
      fetch("./api/sharefaith/platform.json"),
      fetch("./api/sharefaith/methods.json"),
      fetch("./api/sharefaith/testimonials.json")
    ]);

    const platform = await platformRes.json();
    const methods = await methodsRes.json();
    const testimonials = await testimonialsRes.json();

    if (platformNode) {
      platformNode.textContent =
        platform.provider + " (" + platform.status + "): " + platform.description + " " + platform.summary;
    }

    if (methodsNode) {
      methodsNode.innerHTML = methods
        .map(function toCard(method) {
          return (
            '<article class="card">' +
            "<h3>" + method.name + "</h3>" +
            "<p>" + method.description + "</p>" +
            "</article>"
          );
        })
        .join("");
    }

    if (testimonialsNode) {
      testimonialsNode.innerHTML = testimonials
        .map(function toTestimonial(entry) {
          return (
            "<li><strong>" + entry.author + "</strong> (" + entry.role + "): " + entry.quote + "</li>"
          );
        })
        .join("");
    }
  } catch (error) {
    if (platformNode) {
      platformNode.textContent = "Sharefaith static preview endpoints are unavailable.";
    }
  }
}

initSharefaithGiving();
