(function guardAdminBrandPages() {
  var tokenKey = "ncc_admin_token";

  function hasStaffAccess() {
    try {
      const token = localStorage.getItem(tokenKey);
      return !!(token && token !== "demo-token");
    } catch (err) {
      return false;
    }
  }

  if (!hasStaffAccess()) {
    var page = (window.location.pathname.split("/").pop() || "brand.html").replace(/\.html$/i, "");
    window.location.replace("./admin.html?staff=" + encodeURIComponent(page));
  }
})();
