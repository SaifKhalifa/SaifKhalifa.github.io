const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const setBodyScrolled = () => {
  document.body.classList.toggle("scrolled", window.scrollY > 12);
};

window.addEventListener("load", () => {
  document.body.classList.remove("preload");
  document.body.classList.add("loaded");
  setBodyScrolled();
});

window.addEventListener("scroll", setBodyScrolled, { passive: true });

const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");

if (navToggle && navLinks) {
  const toggleNav = () => {
    const isOpen = document.body.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  };

  navToggle.addEventListener("click", toggleNav);
  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (document.body.classList.contains("nav-open")) {
        document.body.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  });
}

const revealTargets = document.querySelectorAll("[data-reveal]");
if (revealTargets.length) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  revealTargets.forEach((target) => revealObserver.observe(target));
}

const sections = Array.from(document.querySelectorAll("section[id]"));
const navLinkMap = new Map();
document.querySelectorAll(".nav-links a").forEach((link) => {
  navLinkMap.set(link.getAttribute("href"), link);
});

if (sections.length && navLinkMap.size) {
  const highlightNav = (id) => {
    navLinkMap.forEach((link, href) => {
      const isActive = href === `#${id}`;
      link.classList.toggle("active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          highlightNav(entry.target.id);
        }
      });
    },
    { rootMargin: "-40% 0px -50% 0px" }
  );

  sections.forEach((section) => sectionObserver.observe(section));
}

const backToTop = document.querySelector(".back-to-top");
if (backToTop) {
  const toggleBackToTop = () => {
    backToTop.classList.toggle("is-visible", window.scrollY > 600);
  };

  window.addEventListener("scroll", toggleBackToTop, { passive: true });
  toggleBackToTop();

  backToTop.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  });
}

const tiltCards = document.querySelectorAll("[data-tilt]");
if (!prefersReducedMotion && tiltCards.length) {
  tiltCards.forEach((card) => {
    const handleMove = (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty("--tilt-x", `${-y * 8}deg`);
      card.style.setProperty("--tilt-y", `${x * 10}deg`);
    };

    const handleLeave = () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    };

    card.addEventListener("mousemove", handleMove);
    card.addEventListener("mouseleave", handleLeave);
  });
}

const orbs = document.querySelectorAll(".orb");
if (!prefersReducedMotion && orbs.length) {
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;

  window.addEventListener(
    "mousemove",
    (event) => {
      targetX = (event.clientX / window.innerWidth - 0.5) * 2;
      targetY = (event.clientY / window.innerHeight - 0.5) * 2;
    },
    { passive: true }
  );

  const animateOrbs = () => {
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;

    orbs.forEach((orb) => {
      const depth = Number.parseFloat(orb.dataset.depth) || 0.1;
      const x = currentX * depth * 60;
      const y = currentY * depth * 60;
      orb.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });

    window.requestAnimationFrame(animateOrbs);
  };

  animateOrbs();
}