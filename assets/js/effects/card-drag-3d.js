const LIGHT = normalize({ x: -1, y: 0.05, z: 0.2 });
const AMBIENT = 0.35;
const DIFFUSE = 0.65;

function normalize(v) {
  const len = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function faceNormal(rotXDeg, rotYDeg) {
  const rx = rotXDeg * Math.PI / 180;
  const ry = rotYDeg * Math.PI / 180;
  return {
    x: Math.sin(ry),
    y: -Math.cos(ry) * Math.sin(rx),
    z: Math.cos(ry) * Math.cos(rx)
  };
}

function shade(normal) {
  return AMBIENT + DIFFUSE * Math.max(dot(normal, LIGHT), 0);
}

function init3dCardDrag() {
  const cardContainers = document.querySelectorAll(".card-drag-3d");

  for (const container of cardContainers) {
    const card = container.querySelector('.card'); // was: cardContainers.querySelector

    const face_front = card.querySelector('.face-front')
    const face_left = card.querySelector('.face-left')
    const face_right = card.querySelector('.face-right')
    const face_top = card.querySelector('.face-top')
    const face_bottom = card.querySelector('.face-bottom')
    
    if (card === null) {
      console.error(`Failed to setup the 3d hover effect for a container\n${container}`);
      continue;
    }

    card.data = {
      rotX: 0,
      rotY: 0,
      isDragging: false,
      lastX: 0,
      lastY: 0,
      flipped: false
    }

    const safeMod = (n, m) => ((n % m) + m) % m;
    const clamp = (n, a, b) => Math.min(Math.max(n, a), b)
    
    function applyRotation() {
      card.style.transform = `rotateX(${card.data.rotX}deg) rotateY(${card.data.rotY}deg)`;

      if (face_front) {
        const n = faceNormal(card.data.rotX, card.data.rotY);
        face_front.style.filter = `brightness(${shade(n)})`;
      }
      if (face_left) {
        const n = faceNormal(card.data.rotX, card.data.rotY - 90);
        face_left.style.filter = `brightness(${shade(n)})`;
      }
      if (face_right) {
        const n = faceNormal(card.data.rotX, card.data.rotY + 90);
        face_right.style.filter = `brightness(${shade(n)})`;
      }
      if (face_top) {
        const n = faceNormal(card.data.rotX, -90);
        face_top.style.filter = `brightness(${shade(n)})`;
      }
      if (face_bottom) {
        const n = faceNormal(card.data.rotX, 90);
        face_bottom.style.filter = `brightness(${shade(n)})`;
      }
    }
    applyRotation();
    
    function startDrag(x, y) {
      card.data.isDragging = true;
      card.data.lastX = x;
      card.data.lastY = y;

      if ("timeout" in card) {
        clearTimeout(card.timeout)
      }

      container.classList.add('effect-active');
    }
    
    function moveDrag(x, y) {
      if (!card.data.isDragging) return;
    
      card.data.rotY += (x - card.data.lastX) * 0.4;
    
      const prevRotX = card.data.rotX;
      card.data.rotX -= (y - card.data.lastY) * 0.4;
      card.data.rotX = clamp(card.data.rotX, -90, 90);
    
      const appliedDy = (prevRotX - card.data.rotX) / 0.4;
      card.data.lastY += appliedDy;
    
      card.data.lastX = x;
      applyRotation();
    }

    function reset() {
      card.data.rotX = 0;
      card.data.rotY = Math.round(card.data.rotY / 180) * 180;
      card.data.flipped = safeMod(card.data.rotY / 180, 2) == 1;
      
      applyRotation();
      
      container.classList.remove('effect-active');

      card.timeout = setTimeout(() => {
        if (card.data.flipped) {
          card.data.rotY -= 180;
          card.data.flipped = false;
          applyRotation();
        }
      }, 3000)
    }
    
    function endDrag() {
      card.timeout = setTimeout(reset, 5000)
      
      card.data.isDragging = false;
    }
    
    // Mouse
    container.addEventListener('mousedown', e => startDrag(e.clientX, e.clientY));
    window.addEventListener('mousemove', e => moveDrag(e.clientX, e.clientY));
    window.addEventListener('mouseup', endDrag);
    
    // Touch
    container.addEventListener('touchstart', e => {
      const t = e.touches[0];
      startDrag(t.clientX, t.clientY);
    });
    container.addEventListener('touchmove', e => {
      const t = e.touches[0];
      moveDrag(t.clientX, t.clientY);
      e.preventDefault();
    }, { passive: false });
    container.addEventListener('touchend', endDrag);
  }
}

document.addEventListener('DOMContentLoaded', init3dCardDrag);