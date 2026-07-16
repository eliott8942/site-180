function initSlider() {
  const mq = window.matchMedia('(min-width: 1024px)');
  let swiper;

  function handleChange(e) {
    if (e.matches) {
      // Desktop: destroy Swiper, let CSS handle static layout
      if (swiper) {
        swiper.destroy(true, true); // true, true = clean up styles + classes
        swiper = null;
      }
    } else {
      // Mobile: create Swiper if it doesn't exist
      if (!swiper) {
        swiper = new Swiper(".fringale-slider", {
          spaceBetween: 24,
          loop: false,
          pagination: {
            el: ".fringale-slider-pagination",
            type: "bullets",
            clickable: true,
          },
          slidesPerGroup: 1,
          slidesPerView: 1,
          centeredSlides: false,
        });
      }
    }
  }

  mq.addEventListener('change', handleChange);
  handleChange(mq); // run on load
}

document.addEventListener('DOMContentLoaded', initSlider);