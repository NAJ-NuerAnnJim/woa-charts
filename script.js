// ==========================================
// 1. INITIAL SCROLL RESTORATION
// ==========================================
if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
}
window.scrollTo(0, 0);

// ==========================================
// 2. MAIN INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    initSettings();
    initPageTransitions();
    initLogoHover();
    initHamburgerMenu();
    initDropdownSubmenu();
});

// ==========================================
// 3. FEATURE MODULES
// ==========================================

/**
 * โหลดการตั้งค่าธีมและแอนิเมชันจาก localStorage
 */
function initSettings() {
    const savedTheme = localStorage.getItem("app_theme") || "light";
    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
    }

    const isAnimationEnabled = localStorage.getItem("setting_enableAnimation") !== "false";
    if (!isAnimationEnabled) {
        document.body.classList.add("no-animations");
    }
}

/**
 * จัดการเอฟเฟกต์เปลี่ยนหน้า (Fade-in / Fade-out) และดักจับการคลิกลิงก์
 */
function initPageTransitions() {
    requestAnimationFrame(() => {
        setTimeout(() => {
            document.body.classList.add("fade-in");
        }, 30);
    });

    document.addEventListener("click", (e) => {
        // 1. ดักจับแท็ก <a> ภายในเว็บไซต์เดียวกัน
        const link = e.target.closest("a");
        if (link && link.hostname === window.location.hostname && link.target !== "_blank") {
            const href = link.getAttribute("href");
            if (href && !href.startsWith("#")) {
                e.preventDefault();
                navigateTo(link.href);
                return;
            }
        }

        // 2. ดักจับปุ่มในเมนูที่มี data-href
        const menuBtn = e.target.closest(".menu-card button[data-href]");
        if (menuBtn) {
            e.preventDefault();
            navigateTo(menuBtn.dataset.href);
        }
    });
}

/**
 * เปลี่ยนข้อความโลโก้แบบนุ่มนวลมี Fade เล็กน้อยเมื่อนำเมาส์ไปชี้
 */
function initLogoHover() {
    const logoSpan = document.getElementById("logoText");
    if (!logoSpan) return;

    let swapTimer = null;
    const smoothSwapText = (newText) => {
        if (logoSpan.textContent === newText) return;
        if (swapTimer) clearTimeout(swapTimer);

        if (document.body.classList.contains("no-animations")) {
            logoSpan.textContent = newText;
            return;
        }

        logoSpan.style.opacity = "0";
        swapTimer = setTimeout(() => {
            logoSpan.textContent = newText;
            logoSpan.style.opacity = "1";
        }, 120);
    };

    logoSpan.addEventListener("mouseenter", () => {
        smoothSwapText("NAJ - World of Airport Charts");
    });
    logoSpan.addEventListener("mouseleave", () => {
        smoothSwapText("NAJ - WoA Charts");
    });
}

/**
 * จัดการเมนู Hamburger และการเลื่อนแนวนอนบน Topbar
 */
function initHamburgerMenu() {
    const hamburgerMenu = document.getElementById("hamburgerMenu");
    const menuCard = document.querySelector(".menu-card");
    const dropdownToggleBtn = document.getElementById("dropdownToggleBtn");
    const friendsSubmenu = document.getElementById("friendsSubmenu");
    const dropdownContainer = document.querySelector(".dropdown-container");

    if (!hamburgerMenu || !menuCard) return;

    // กำหนดลำดับ index ให้ปุ่มในเมนูอัตโนมัติเพื่อทำ Staggered Delay
    menuCard.querySelectorAll("button").forEach((btn, idx) => {
        if (!btn.style.getPropertyValue("--menu-index")) {
            btn.style.setProperty("--menu-index", idx);
        }
    });

    const closeSubmenu = () => {
        if (friendsSubmenu) friendsSubmenu.classList.remove("show");
    };

    const syncMenuOverflow = () => {
        const maxAllowedWidth = Math.min(window.innerWidth * 0.65, window.innerWidth - 110);
        const shouldScroll = menuCard.scrollWidth > maxAllowedWidth;

        menuCard.style.maxWidth = `${maxAllowedWidth}px`;
        menuCard.style.overflowX = shouldScroll ? "auto" : "visible";
        menuCard.style.overflowY = "visible";
    };

    const openMenu = () => {
        hamburgerMenu.classList.add("active");
        menuCard.classList.add("visible");
        hamburgerMenu.setAttribute("aria-expanded", "true");
        syncMenuOverflow();
    };

    const closeMenu = () => {
        hamburgerMenu.classList.remove("active");
        menuCard.classList.remove("visible");
        hamburgerMenu.setAttribute("aria-expanded", "false");
        closeSubmenu();
    };

    // เปิด-ปิดเมนูหลัก
    hamburgerMenu.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        menuCard.classList.contains("visible") ? closeMenu() : openMenu();
    });

    // รองรับการกด Enter / Space บนปุ่ม Hamburger
    hamburgerMenu.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            menuCard.classList.contains("visible") ? closeMenu() : openMenu();
        }
    });

    menuCard.addEventListener("click", (e) => e.stopPropagation());

    // ปิดเมนูเมื่อคลิกพื้นที่ด้านนอก
    document.addEventListener("click", (e) => {
        const clickedInsideMenu = menuCard.contains(e.target);
        const clickedHamburger = hamburgerMenu.contains(e.target);
        const clickedInsideDropdown = dropdownContainer && dropdownContainer.contains(e.target);

        if (!clickedInsideMenu && !clickedHamburger) {
            closeMenu();
            return;
        }

        if (clickedInsideMenu && !clickedInsideDropdown && e.target !== dropdownToggleBtn) {
            closeSubmenu();
        }
    });

    // อัปเดตขนาดเมื่อเปลี่ยนความกว้างหน้าจอ
    window.addEventListener("resize", syncMenuOverflow);
    syncMenuOverflow();

    // Smooth Horizontal Wheel Scroll สำหรับแถบเมนู
    let targetScrollLeft = 0;
    let isScrolling = false;

    const updateScroll = () => {
        const distance = targetScrollLeft - menuCard.scrollLeft;
        if (Math.abs(distance) > 0.5) {
            menuCard.scrollLeft += distance * 0.14;
            requestAnimationFrame(updateScroll);
        } else {
            menuCard.scrollLeft = targetScrollLeft;
            isScrolling = false;
        }
    };

    menuCard.addEventListener("wheel", (e) => {
        if (e.deltaY === 0) return;

        e.preventDefault();
        if (!isScrolling) {
            targetScrollLeft = menuCard.scrollLeft;
        }

        const scrollSpeed = 0.5;
        const maxScroll = menuCard.scrollWidth - menuCard.clientWidth;
        targetScrollLeft = Math.max(0, Math.min(maxScroll, targetScrollLeft + e.deltaY * scrollSpeed));

        if (!isScrolling) {
            isScrolling = true;
            requestAnimationFrame(updateScroll);
        }
    }, { passive: false });
}

/**
 * จัดการเมนูย่อย (Dropdown Submenu) ใต้ปุ่ม Profile
 */
function initDropdownSubmenu() {
    const dropdownToggleBtn = document.getElementById("dropdownToggleBtn");
    const friendsSubmenu = document.getElementById("friendsSubmenu");
    const menuCard = document.querySelector(".menu-card");

    if (!dropdownToggleBtn || !friendsSubmenu) return;

    document.body.appendChild(friendsSubmenu);

    const updateSubmenuPosition = () => {
        const rect = dropdownToggleBtn.getBoundingClientRect();
        const topbar = document.querySelector(".topbar");
        const topbarHeight = topbar ? topbar.offsetHeight : 0;

        friendsSubmenu.style.position = "fixed";
        friendsSubmenu.style.top = `${topbarHeight + 5}px`;
        friendsSubmenu.style.left = `${rect.left}px`;
        friendsSubmenu.style.width = `${rect.width}px`;
        friendsSubmenu.style.zIndex = "9999";
    };

    dropdownToggleBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const willOpen = !friendsSubmenu.classList.contains("show");
        if (!willOpen) {
            friendsSubmenu.classList.remove("show");
            return;
        }

        const isAtTop = window.scrollY === 0 || document.documentElement.scrollTop === 0;
        const isAutoScrollEnabled = localStorage.getItem("setting_autoScrollTop") !== "false";

        if (isAtTop || !isAutoScrollEnabled) {
            updateSubmenuPosition();
            friendsSubmenu.classList.add("show");
        } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
            setTimeout(() => {
                updateSubmenuPosition();
                friendsSubmenu.classList.add("show");
            }, 350);
        }
    });

    if (menuCard) {
        menuCard.addEventListener("scroll", () => {
            if (friendsSubmenu.classList.contains("show")) updateSubmenuPosition();
        }, { passive: true });

        menuCard.querySelectorAll("button").forEach((button) => {
            if (button !== dropdownToggleBtn) {
                button.addEventListener("click", () => friendsSubmenu.classList.remove("show"));
            }
        });
    }

    window.addEventListener("resize", () => {
        if (friendsSubmenu.classList.contains("show")) updateSubmenuPosition();
    });

    friendsSubmenu.addEventListener("click", (e) => e.stopPropagation());

    const handleScrollClose = (e) => {
        if (!friendsSubmenu.classList.contains("show")) return;
        if (!friendsSubmenu.contains(e.target)) {
            friendsSubmenu.classList.remove("show");
        }
    };

    window.addEventListener("wheel", handleScrollClose, { passive: true });
    window.addEventListener("touchmove", handleScrollClose, { passive: true });
}

// ==========================================
// 4. GLOBAL HELPER FUNCTIONS
// ==========================================

let isNavigating = false;

/**
 * เปลี่ยนหน้าพร้อมแอนิเมชัน Fade-out อย่างนุ่มนวล
 */
function navigateTo(url) {
    if (isNavigating) return;

    if (document.body.classList.contains("no-animations")) {
        window.location.href = url;
        return;
    }

    isNavigating = true;
    document.body.classList.remove("fade-in");
    document.body.classList.add("fade-out");

    setTimeout(() => {
        window.location.href = url;
    }, 360);
}

/**
 * เปิด Modal กลาง
 */
function openModal(modalElement) {
    if (!modalElement) return;

    window.scrollTo({ top: 0, behavior: "instant" });
    document.body.style.overflow = "hidden";

    modalElement.classList.remove("closing");
    modalElement.style.display = "flex";
    requestAnimationFrame(() => {
        modalElement.classList.add("show");
    });
}

/**
 * ปิด Modal กลาง
 */
function closeModal(modalElement) {
    if (!modalElement || !modalElement.classList.contains("show")) return;

    document.body.style.overflow = "";
    modalElement.classList.remove("show");
    modalElement.classList.add("closing");

    setTimeout(() => {
        modalElement.style.display = "none";
        modalElement.classList.remove("closing");
    }, 280);
}

/**
 * กดค้างเพื่อดูรหัสผ่าน / ปล่อยเพื่อซ่อน
 */
function showPassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (input) {
        input.type = "text";
        btn.textContent = "Ø";
    }
}

function hidePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (input) {
        input.type = "password";
        btn.textContent = "O";
    }
}
