const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let activeScrollAnimation = null;

const clamp = (min, value, max) => Math.min(max, Math.max(min, value));
const easeInOutQuint = (t) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2);
const getScrollDuration = (distance) => clamp(700, 500 + Math.abs(distance) * 0.6, 1600);

const smoothScrollTo = (targetY) => {
  const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
  const clampedTarget = clamp(0, targetY, Math.max(maxScrollY, 0));

  if (prefersReducedMotion) {
    window.scrollTo(0, clampedTarget);
    return;
  }

  if (activeScrollAnimation) {
    window.cancelAnimationFrame(activeScrollAnimation);
    activeScrollAnimation = null;
  }

  const startY = window.scrollY || window.pageYOffset;
  const distance = clampedTarget - startY;

  if (Math.abs(distance) < 2) {
    return;
  }

  const duration = getScrollDuration(distance);
  const startTime = performance.now();

  const step = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeInOutQuint(progress);

    window.scrollTo(0, startY + distance * eased);

    if (progress < 1) {
      activeScrollAnimation = window.requestAnimationFrame(step);
    } else {
      activeScrollAnimation = null;
    }
  };

  activeScrollAnimation = window.requestAnimationFrame(step);
};

const setBodyScrolled = () => {
  document.body.classList.toggle("scrolled", window.scrollY > 12);
};

window.addEventListener("load", () => {
  document.body.classList.remove("preload");
  document.body.classList.add("loaded");
  setBodyScrolled();

  const splash = document.querySelector(".splash");
  if (splash) {
    const blurDuration = prefersReducedMotion ? 500 : 900;
    const messageDuration = prefersReducedMotion ? 1200 : 2000;
    const blurStartDelay = prefersReducedMotion ? 100 : 200;
    const messageStartDelay = blurStartDelay + blurDuration + 100;
    const exitDelay = messageStartDelay + messageDuration;

    document.body.classList.remove("splash-blur", "splash-exit");

    window.setTimeout(() => {
      document.body.classList.add("splash-blur");
    }, blurStartDelay);

    window.setTimeout(() => {
      splash.classList.add("show-message");
    }, messageStartDelay);

    window.setTimeout(() => {
      splash.classList.add("is-exiting");
      document.body.classList.add("splash-exit");
      document.body.classList.remove("splash-blur");

      window.setTimeout(() => {
        splash.remove();
        document.body.classList.remove("splash-active", "splash-exit");
      }, 1000);
    }, exitDelay);
  } else {
    document.body.classList.remove("splash-active");
  }
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

const handleSmoothScroll = (event) => {
  const anchor = event.target.closest('a[href^="#"]');
  if (!anchor || anchor.getAttribute("aria-disabled") === "true") {
    return;
  }

  const href = anchor.getAttribute("href");
  if (!href || href === "#") {
    return;
  }

  const target = document.querySelector(href);
  if (!target) {
    return;
  }

  event.preventDefault();
  const targetTop = target.getBoundingClientRect().top + window.scrollY;
  smoothScrollTo(targetTop);
};

document.addEventListener("click", handleSmoothScroll);

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

let currentSectionId = sections[0]?.id || "";
const backToTopWrap = document.querySelector(".back-to-top-wrap");
const backToTopMenuList = document.querySelector(".back-to-top-list");

const getSectionLabel = (section) => {
  const navLink = navLinkMap.get(`#${section.id}`);
  if (navLink) {
    return navLink.textContent.trim();
  }

  const heading = section.querySelector("h2");
  if (heading) {
    return heading.textContent.trim();
  }

  return section.id.replace(/-/g, " ");
};

const sectionMeta = sections.map((section) => ({
  id: section.id,
  label: getSectionLabel(section),
}));

const renderBackToTopMenu = () => {
  if (!backToTopMenuList || !backToTopWrap) {
    return;
  }

  backToTopMenuList.innerHTML = "";

  const currentIndex = sectionMeta.findIndex((meta) => meta.id === currentSectionId);
  const previousSections = currentIndex > 0 ? sectionMeta.slice(0, currentIndex) : [];

  if (!previousSections.length) {
    backToTopWrap.classList.remove("has-sections");
    return;
  }

  backToTopWrap.classList.add("has-sections");
  previousSections.forEach((meta) => {
    const listItem = document.createElement("li");
    const link = document.createElement("a");
    link.href = `#${meta.id}`;
    link.textContent = meta.label;
    listItem.appendChild(link);
    backToTopMenuList.appendChild(listItem);
  });
};

if (sections.length && navLinkMap.size) {
  const highlightNav = (id) => {
    currentSectionId = id;
    navLinkMap.forEach((link, href) => {
      const isActive = href === `#${id}`;
      link.classList.toggle("active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    renderBackToTopMenu();
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

renderBackToTopMenu();

const backToTop = document.querySelector(".back-to-top");
if (backToTop && backToTopWrap) {
  const canHover = window.matchMedia("(hover: hover)").matches;
  const isTouch = window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
  const openOnTap = isTouch || !canHover;
  const openMenu = () => {
    if (!backToTopWrap.classList.contains("has-sections")) {
      return;
    }
    backToTopWrap.classList.add("menu-open");
  };

  const closeMenu = () => {
    backToTopWrap.classList.remove("menu-open");
  };

  const toggleBackToTop = () => {
    backToTopWrap.classList.toggle("is-visible", window.scrollY > 600);
  };

  window.addEventListener("scroll", toggleBackToTop, { passive: true });
  toggleBackToTop();

  backToTop.addEventListener("click", () => {
    if (openOnTap && backToTopWrap.classList.contains("has-sections")) {
      if (!backToTopWrap.classList.contains("menu-open")) {
        openMenu();
        return;
      }
    }

    closeMenu();
    smoothScrollTo(0);
  });

  backToTop.addEventListener("mouseenter", () => {
    if (canHover && !openOnTap) {
      backToTopWrap.classList.add("menu-hover");
    }
  });

  backToTop.addEventListener("mouseleave", () => {
    backToTopWrap.classList.remove("menu-hover");
  });

  backToTop.addEventListener("focus", () => {
    backToTopWrap.classList.add("menu-hover");
  });

  backToTop.addEventListener("blur", () => {
    backToTopWrap.classList.remove("menu-hover");
  });

  const backToTopMenu = backToTopWrap.querySelector(".back-to-top-menu");
  if (backToTopMenu) {
    backToTopMenu.addEventListener("click", () => {
      closeMenu();
    });
  }

  document.addEventListener("click", (event) => {
    if (!backToTopWrap.contains(event.target)) {
      closeMenu();
    }
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