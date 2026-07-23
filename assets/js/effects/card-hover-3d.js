function initHover3DEffect() {
  const cardContainers = document.querySelectorAll(".card-hover-3d");
  for (const container of cardContainers) {
    const innerCard = container.querySelector('.card'); // was: cardContainers.querySelector
    if (innerCard === null) {
      console.error(`Failed to setup the 3d hover effect for a container\n${container}`);
      continue;
    }

    function handleMove(x, y) {
      const rect = container.getBoundingClientRect(); // was: wrap.getBoundingClientRect()

      const px = (x - rect.left) / rect.width;
      const py = (y - rect.top) / rect.height;

      innerCard.style.setProperty('--px', `${px}`);
      innerCard.style.setProperty('--py', `${py}`);

      innerCard.style.transform = 
        `rotateX(
          calc(
            (var(--py) - 0.5) * var(--max-tilt) * 2 * -1
          )
        )
        rotateY(
          calc(
            (var(--px) - 0.5) * var(--max-tilt) * 2 * 1
          )
        )
        scale3d(1.03, 1.03, 1.03)
        translateY(-4px)`;
    }
    
    container.addEventListener('mousemove', (e) => {
      handleMove(e.clientX, e.clientY)
    });
    container.addEventListener('touchmove', (e) => {
      handleMove(e.touches[0].clientX, e.touches[0].clientY)
    })

    container.addEventListener('pointerleave', () => {
      innerCard.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1,1,1) translateY(0px)';
    });
    container.addEventListener('touchend', () => {
      innerCard.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1,1,1) translateY(0px)';
    })
  }
}
document.addEventListener('DOMContentLoaded', initHover3DEffect);