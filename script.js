/* =========================================================
   NEXUS — interactions and motion
   No libraries, no backend, no AI.
   ========================================================= */
"use strict";

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;

// Mobile navigation
const menuToggle = $(".menu-toggle");
const mainNav = $(".main-nav");

menuToggle?.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

$$(".nav-link").forEach(link => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
    $$(".nav-link").forEach(item => item.classList.toggle("active", item === link));
  });
});

// Scroll reveal with graceful fallback
const revealItems = $$(".reveal");
if ("IntersectionObserver" in window && !reducedMotion) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach(item => revealObserver.observe(item));
} else {
  revealItems.forEach(item => item.classList.add("visible"));
}

// Cursor glow and gentle hero parallax
const cursorGlow = $(".cursor-glow");
const heroArt = $("#hero-art");
let pointerX = window.innerWidth / 2;
let pointerY = window.innerHeight / 2;

if (finePointer && !reducedMotion) {
  document.body.classList.add("pointer-active");
  window.addEventListener("pointermove", event => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (cursorGlow) {
      cursorGlow.style.left = `${pointerX}px`;
      cursorGlow.style.top = `${pointerY}px`;
    }
    if (heroArt) {
      const rect = heroArt.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        const x = (event.clientX - (rect.left + rect.width / 2)) / rect.width;
        const y = (event.clientY - (rect.top + rect.height / 2)) / rect.height;
        heroArt.style.transform = `perspective(1000px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg)`;
      }
    }
  }, { passive: true });
  heroArt?.addEventListener("pointerleave", () => {
    heroArt.style.transform = "";
  });
}

// Filter experiment cards
const filterButtons = $$(".filter-button");
const projectCards = $$(".project-card");
filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    filterButtons.forEach(item => item.classList.toggle("active", item === button));
    const filter = button.dataset.filter;
    projectCards.forEach(card => {
      const matches = filter === "all" || card.dataset.category === filter;
      card.classList.toggle("is-hidden", !matches);
      if (matches) card.animate?.(
        [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "translateY(0)" }],
        { duration: reducedMotion ? 1 : 320, easing: "ease-out" }
      );
    });
  });
});

// Project card tilt on desktop, with a restrained maximum angle
if (finePointer && !reducedMotion) {
  projectCards.forEach(card => {
    const visual = $(".project-visual", card);
    card.addEventListener("pointermove", event => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateY = (x - 0.5) * 5;
      const rotateX = (0.5 - y) * 4;
      visual.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    card.addEventListener("pointerleave", () => {
      visual.style.transform = "";
    });
  });
}

// Experiment modal
const modal = $("#experiment-modal");
const modalTitle = $("#modal-title");
const modalType = $("#modal-type");
const modalDescription = $("#modal-description");
const modalArt = $("#modal-art");
const modalObject = $(".modal-object");
const modalOrbit = $(".modal-orbit");
const toast = $("#toast");
let lastFocusedElement = null;
let toastTimeout;

const experiments = {
  "Orbit Shift": {
    type: "MOTION STUDY",
    description: "Move your pointer around the experiment to influence its motion. The orbit reacts to direction and distance — a small study in responsive movement.",
    colors: ["#a99bff", "#55d8ff"]
  },
  "Liquid Form": {
    type: "FORM STUDY",
    description: "A soft shape that continuously changes its silhouette. Watch the gradients and curves flow together like a digital material.",
    colors: ["#b9a8ff", "#55d8ff"]
  },
  "Afterglow": {
    type: "LIGHT STUDY",
    description: "A quiet study in contrast, glow, and color. Move around the canvas and see how a small shift in perspective changes the atmosphere.",
    colors: ["#f0a0ff", "#6f8dff"]
  }
};

function openExperiment(card) {
  const title = $("h3", card)?.textContent.trim() || "Experiment";
  const experiment = experiments[title] || experiments["Orbit Shift"];
  lastFocusedElement = card;
  modalTitle.textContent = title;
  modalType.textContent = experiment.type;
  modalDescription.textContent = experiment.description;
  modalObject.style.background = `radial-gradient(circle at 28% 23%, #fff, ${experiment.colors[0]} 5%, #6755d0 27%, #17162f 72%)`;
  modalObject.style.boxShadow = `0 0 55px ${experiment.colors[0]}88`;
  modalOrbit.style.borderColor = experiment.colors[1];
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  $(".modal-close", modal).focus();
}
function closeExperiment() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  lastFocusedElement?.focus();
}
projectCards.forEach(card => {
  card.addEventListener("click", () => openExperiment(card));
  card.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openExperiment(card);
    }
  });
});
$$("[data-close-modal]").forEach(button => button.addEventListener("click", closeExperiment));
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && modal.classList.contains("open")) closeExperiment();
});

// Make the object in the modal react to pointer/touch
modalArt?.addEventListener("pointermove", event => {
  if (reducedMotion) return;
  const rect = modalArt.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;
  modalObject.style.transform = `translate(${x * 25}px, ${y * 18}px) rotateX(${-y * 18}deg) rotateY(${x * 22}deg)`;
  modalOrbit.style.transform = `rotate(${x * 35 - 25}deg) scale(${1 + Math.abs(y) * .1})`;
});

// Canvas particles: lightweight background ambience
const canvas = $("#particle-canvas");
const ctx = canvas?.getContext("2d", { alpha: true });
let particles = [];
let canvasWidth = 0;
let canvasHeight = 0;
let dpr = Math.min(window.devicePixelRatio || 1, 1.7);
let animationFrame = 0;

function makeParticles() {
  const count = Math.min(70, Math.floor((canvasWidth * canvasHeight) / 19000));
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight,
    r: Math.random() * 1.4 + 0.35,
    vx: (Math.random() - 0.5) * 0.18,
    vy: (Math.random() - 0.5) * 0.18,
    alpha: Math.random() * 0.48 + 0.12,
    hue: Math.random() > 0.72 ? 190 : 250
  }));
}
function resizeCanvas() {
  if (!canvas || !ctx) return;
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 1.7);
  canvas.width = Math.floor(canvasWidth * dpr);
  canvas.height = Math.floor(canvasHeight * dpr);
  canvas.style.width = `${canvasWidth}px`;
  canvas.style.height = `${canvasHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  makeParticles();
}
function drawParticles() {
  if (!ctx || reducedMotion || document.hidden) return;
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < -5) p.x = canvasWidth + 5;
    if (p.x > canvasWidth + 5) p.x = -5;
    if (p.y < -5) p.y = canvasHeight + 5;
    if (p.y > canvasHeight + 5) p.y = -5;

    const dx = pointerX - p.x;
    const dy = pointerY - p.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (finePointer && distance < 140 && distance > 0) {
      p.x -= (dx / distance) * 0.12;
      p.y -= (dy / distance) * 0.12;
    }

    ctx.beginPath();
    ctx.fillStyle = `hsla(${p.hue}, 90%, 75%, ${p.alpha})`;
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();

    // Connect only nearby particles to keep the scene subtle.
    for (let j = i + 1; j < particles.length; j++) {
      const q = particles[j];
      const ddx = p.x - q.x;
      const ddy = p.y - q.y;
      const dist = Math.sqrt(ddx * ddx + ddy * ddy);
      if (dist < 95) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(129, 130, 255, ${0.075 * (1 - dist / 95)})`;
        ctx.lineWidth = 0.6;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
    }
  }
  animationFrame = requestAnimationFrame(drawParticles);
}
if (canvas && ctx && !reducedMotion) {
  resizeCanvas();
  drawParticles();
  window.addEventListener("resize", resizeCanvas, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(animationFrame);
    else drawParticles();
  });
}

// A small welcome hint appears when filtering, not on every load.
filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    if (button.dataset.filter !== "all") {
      toast.textContent = `Showing ${button.textContent.trim().replace(/\s+\d+$/, "")}`;
      toast.classList.add("show");
      clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => toast.classList.remove("show"), 1500);
    }
  });
});

// Active nav section tracking
const sections = $$("main section[id]");
if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        $$(".nav-link").forEach(link => {
          link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      }
    });
  }, { rootMargin: "-35% 0px -55% 0px" });
  sections.forEach(section => sectionObserver.observe(section));
}
