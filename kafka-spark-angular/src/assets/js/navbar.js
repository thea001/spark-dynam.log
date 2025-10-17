
document.addEventListener('DOMContentLoaded', function() {
// Admin Panel settings

//****************************
/* This is for the mini-sidebar if width is less then 1170*/
//****************************
var setSidebarType = function() {
  var width = window.innerWidth > 0 ? window.innerWidth : screen.width;
  if (width < 1199) {
    document.getElementById("main-wrapper").classList.add("mini-sidebar");
  } else {
    document.getElementById("main-wrapper").setAttribute("data-sidebartype", "full");
    document.getElementById("main-wrapper").classList.remove("mini-sidebar");
  }
};

setSidebarType(); // Call initially

window.addEventListener("resize", setSidebarType);

//****************************
/* This is for sidebartoggler*/
//****************************
document.querySelectorAll(".sidebartoggler").forEach(function(element) {
  element.addEventListener("click", function() {
    document.getElementById("main-wrapper").classList.toggle("mini-sidebar");
    if (document.getElementById("main-wrapper").classList.contains("mini-sidebar")) {
      document.querySelectorAll(".sidebartoggler").forEach(function(element) {
        element.checked = true;
      });
    } else {
      document.querySelectorAll(".sidebartoggler").forEach(function(element) {
        element.checked = false;
      });
      document.getElementById("main-wrapper").setAttribute("data-sidebartype", "full");
    }
    document.getElementById("main-wrapper").classList.toggle("show-sidebar");
  });
});
});
