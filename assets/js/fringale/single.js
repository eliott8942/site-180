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

function init() {
  initSlider()

  let swiper;
  const mq = window.matchMedia("(min-width: 1024px)");
  
  function initSwiper() {
    if (!mq.matches && !swiper) {
      swiper = new Swiper(".gallery-slider", {
        spaceBetween: 24,
        loop: false,
        slidesPerView: 1,
        slidesPerGroup: 1,
        centeredSlides: false,
        pagination: {
          el: ".gallery-slider-pagination",
          type: "bullets",
          clickable: true,
        },
        breakpoints: {
          1023: {
            slidesPerView: 1,
            slidesPerGroup: 1,
          },
        },
      });
    } else if (mq.matches && swiper) {
      swiper.destroy(true, true); // deleteInstance, cleanStyles
      swiper = undefined;
    }
  }
  
  initSwiper();
  mq.addEventListener("change", initSwiper);
}

document.addEventListener('DOMContentLoaded', init);