// main script
(function () {
  "use strict";

  // Dropdown Menu Toggler For Mobile
  // ----------------------------------------
  const dropdownMenuToggler = document.querySelectorAll(
    ".nav-dropdown > .nav-link",
  );

  dropdownMenuToggler.forEach((toggler) => {
    toggler?.addEventListener("click", (e) => {
      e.target.parentElement.classList.toggle("active");
    });
  });

  // Testimonial Slider
  // ----------------------------------------
  new Swiper(".testimonial-slider", {
    spaceBetween: 24,
    loop: false,
    pagination: {
      el: ".testimonial-slider-pagination",
      type: "bullets",
      clickable: true,
    },
    slidesPerGroup: 1,
    slidesPerView: 1,
    centeredSlides: false,
    breakpoints: {
      520: {
        slidesPerView: 2,
        slidesPerGroup: 2,
      },
      992: {
        slidesPerView: 3,
        slidesPerGroup: 3,
      },
    },
  });

  // Tag selector handling
  // ----------------------------------------
  // Note : that code is made only for one toggle per page, that code should be updated to account for more if needed
  const tagSelectorInput = document.querySelector("#tag-selector-toggle-inner")
  if (tagSelectorInput) {
    const tagSelectorsWithAutoFold = document.querySelector(".tag-selector-autofold")
    if (tagSelectorsWithAutoFold) {
      document.addEventListener("click", (event) => {
        if (!tagSelectorInput.checked) {
          return
        }
        if (!tagSelectorsWithAutoFold.contains(event.target)) {
          tagSelectorInput.checked = false
        }
      })
    }
  }
})();
