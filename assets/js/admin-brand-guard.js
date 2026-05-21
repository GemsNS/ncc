(function guardAdminBrandPages() {
  var tokenKey = "ncc_admin_token";
  var modeKey = "ncc_admin_mode";

  function hasStaffAccess() {
    try {
      if (localStorage.getItem(tokenKey)) {
        return true;
      }
      if (sessionStorage.getItem(modeKey) === "demo") {
        return true;
      }
    } catch (err) {
      return false;
    }
    return false;
  }

  if (!hasStaffAccess()) {
    var page = (window.location.pathname.split("/").pop() || "brand.html").replace(/\.html$/i, "");
    window.location.replace("./admin.html?staff=" + encodeURIComponent(page));
  }
})();
