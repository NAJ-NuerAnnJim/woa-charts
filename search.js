/**
 * Global Search Engine for NAJ - WoA Charts
 * ค้นหาได้ทั้ง Pages, Settings (พร้อมปุ่มสลับค่าทันที), Credits และ Airport Charts ทั้งหมด
 */
(function () {
    "use strict";

    // ==========================================
    // 1. INJECT STYLES FOR GLOBAL SEARCH BADGES & HIGHLIGHTS
    // ==========================================
    const STYLE_ID = "naj-global-search-styles";
    if (!document.getElementById(STYLE_ID)) {
        const styleEl = document.createElement("style");
        styleEl.id = STYLE_ID;
        styleEl.textContent = `
            .search-dropdown-group-label {
                padding: 7px 10px 3px;
                font-size: 10.5px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #64748b;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .search-dropdown-group-label:not(:first-of-type) {
                margin-top: 4px;
                border-top: 1px solid rgba(0, 0, 0, 0.06);
                padding-top: 8px;
            }
            html.dark-mode .search-dropdown-group-label,
            body.dark-mode .search-dropdown-group-label {
                color: #94a3b8;
                border-top-color: rgba(255, 255, 255, 0.08);
            }

            .dropdown-type-badge {
                flex-shrink: 0;
                min-width: 44px;
                height: 24px;
                padding: 0 7px;
                border-radius: 6px;
                font-size: 10.5px;
                font-weight: 700;
                letter-spacing: 0.03em;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
            }
            .dropdown-type-badge.is-page {
                color: #047857;
                background-color: rgba(16, 185, 129, 0.14);
            }
            .dropdown-type-badge.is-setting {
                color: #6d28d9;
                background-color: rgba(139, 92, 246, 0.14);
            }
            .dropdown-type-badge.is-taxi {
                color: #0369a1;
                background-color: rgba(14, 165, 233, 0.14);
            }
            .dropdown-type-badge.is-info {
                color: #b45309;
                background-color: rgba(245, 158, 11, 0.14);
            }

            html.dark-mode .dropdown-type-badge.is-page,
            body.dark-mode .dropdown-type-badge.is-page {
                color: #6ee7b7;
                background-color: rgba(16, 185, 129, 0.2);
            }
            html.dark-mode .dropdown-type-badge.is-setting,
            body.dark-mode .dropdown-type-badge.is-setting {
                color: #c4b5fd;
                background-color: rgba(139, 92, 246, 0.22);
            }
            html.dark-mode .dropdown-type-badge.is-taxi,
            body.dark-mode .dropdown-type-badge.is-taxi {
                color: #7dd3fc;
                background-color: rgba(14, 165, 233, 0.2);
            }
            html.dark-mode .dropdown-type-badge.is-info,
            body.dark-mode .dropdown-type-badge.is-info {
                color: #fcd34d;
                background-color: rgba(245, 158, 11, 0.2);
            }

            .search-quick-toggle-btn {
                flex-shrink: 0;
                padding: 4px 10px;
                border-radius: 999px;
                border: 1px solid rgba(37, 99, 235, 0.3);
                background-color: rgba(37, 99, 235, 0.1);
                color: #1d4ed8;
                font-size: 11px;
                font-weight: 700;
                cursor: pointer;
                transition: background-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
            }
            .search-quick-toggle-btn:hover {
                background-color: #2563eb;
                color: #ffffff;
                transform: scale(1.04);
            }
            html.dark-mode .search-quick-toggle-btn,
            body.dark-mode .search-quick-toggle-btn {
                border-color: rgba(96, 165, 250, 0.35);
                background-color: rgba(59, 130, 246, 0.2);
                color: #93c5fd;
            }
            html.dark-mode .search-quick-toggle-btn:hover,
            body.dark-mode .search-quick-toggle-btn:hover {
                background-color: #2563eb;
                color: #ffffff;
            }

            @keyframes najTargetPulse {
                0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.55); background-color: rgba(37, 99, 235, 0.12); }
                70% { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); background-color: rgba(37, 99, 235, 0.06); }
                100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
            }
            .naj-search-target-highlight {
                border-radius: 10px;
                animation: najTargetPulse 1.8s cubic-bezier(0.22, 1, 0.36, 1) 1;
            }
        `;
        document.head.appendChild(styleEl);
    }

    // ==========================================
    // 2. FUZZY SEARCH & TEXT HIGHLIGHTING UTILITIES
    // ==========================================
    function levenshteinDistance(a, b) {
        if (a === b) return 0;
        if (!a.length) return b.length;
        if (!b.length) return a.length;

        const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
        for (let i = 1; i <= a.length; i++) {
            let diag = prev[0];
            prev[0] = i;
            for (let j = 1; j <= b.length; j++) {
                const temp = prev[j];
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + cost);
                diag = temp;
            }
        }
        return prev[b.length];
    }

    function findSubsequenceIndices(text, query) {
        const t = text.toLowerCase();
        const q = query.toLowerCase().replace(/\s+/g, "");
        if (q.length < 2) return null;

        const indices = [];
        let qi = 0;
        for (let ti = 0; ti < t.length && qi < q.length; ti++) {
            if (t[ti] === q[qi]) {
                indices.push(ti);
                qi++;
            }
        }
        if (qi !== q.length) return null;

        const span = indices[indices.length - 1] - indices[0] + 1;
        if (q.length === 2 && span > 4) return null;
        if (q.length >= 3 && span > q.length * 2.6) return null;
        return indices;
    }

    function findTypoMatchIndices(text, query) {
        const q = query.toLowerCase().trim();
        if (q.length < 3) return null;

        const wordRegex = /[a-zA-ZÀ-ÿ0-9ก-๙]+/g;
        let match;
        while ((match = wordRegex.exec(text)) !== null) {
            const word = match[0].toLowerCase();
            const maxEdits = word.length <= 3 ? 1 : word.length <= 6 ? 1 : 2;
            if (Math.abs(word.length - q.length) <= maxEdits) {
                const dist = levenshteinDistance(word, q);
                if (dist > 0 && dist <= maxEdits) {
                    const indices = [];
                    const minLen = Math.min(word.length, q.length);
                    for (let k = 0; k < minLen; k++) {
                        if (word[k] === q[k]) indices.push(match.index + k);
                    }
                    return indices.length > 0 ? indices : [match.index];
                }
            }
        }
        return null;
    }

    function buildHighlightedFragment(text, query) {
        const frag = document.createDocumentFragment();
        const cleanQuery = (query || "").trim();
        if (!cleanQuery) {
            frag.appendChild(document.createTextNode(text));
            return frag;
        }

        const lowerText = text.toLowerCase();
        const lowerQuery = cleanQuery.toLowerCase();

        let startIndex = 0;
        let foundIndex = lowerText.indexOf(lowerQuery, startIndex);
        if (foundIndex !== -1) {
            while (foundIndex !== -1) {
                if (foundIndex > startIndex) {
                    frag.appendChild(document.createTextNode(text.slice(startIndex, foundIndex)));
                }
                const mark = document.createElement("mark");
                mark.className = "search-highlight";
                mark.textContent = text.slice(foundIndex, foundIndex + cleanQuery.length);
                frag.appendChild(mark);

                startIndex = foundIndex + cleanQuery.length;
                foundIndex = lowerText.indexOf(lowerQuery, startIndex);
            }
            if (startIndex < text.length) {
                frag.appendChild(document.createTextNode(text.slice(startIndex)));
            }
            return frag;
        }

        const fuzzyIndices = findSubsequenceIndices(text, cleanQuery) || findTypoMatchIndices(text, cleanQuery);
        if (fuzzyIndices && fuzzyIndices.length > 0) {
            const indexSet = new Set(fuzzyIndices);
            let buffer = "";
            let isBufferingHighlight = false;

            for (let i = 0; i < text.length; i++) {
                const shouldHighlight = indexSet.has(i);
                if (i === 0) {
                    isBufferingHighlight = shouldHighlight;
                    buffer = text[i];
                } else if (shouldHighlight === isBufferingHighlight) {
                    buffer += text[i];
                } else {
                    if (isBufferingHighlight) {
                        const mark = document.createElement("mark");
                        mark.className = "search-highlight";
                        mark.textContent = buffer;
                        frag.appendChild(mark);
                    } else {
                        frag.appendChild(document.createTextNode(buffer));
                    }
                    buffer = text[i];
                    isBufferingHighlight = shouldHighlight;
                }
            }
            if (buffer) {
                if (isBufferingHighlight) {
                    const mark = document.createElement("mark");
                    mark.className = "search-highlight";
                    mark.textContent = buffer;
                    frag.appendChild(mark);
                } else {
                    frag.appendChild(document.createTextNode(buffer));
                }
            }
            return frag;
        }

        frag.appendChild(document.createTextNode(text));
        return frag;
    }

    function scoreTextFields(fields, query) {
        const q = query.trim().toLowerCase();
        if (!q) return { score: 1, isFuzzy: false };

        let bestScore = 0;
        let bestIsFuzzy = false;

        for (const { text, weight = 1 } of fields) {
            if (!text) continue;
            const val = String(text).toLowerCase();

            let base = 0;
            let fuzzy = false;

            if (val === q) base = 1000;
            else if (val.startsWith(q)) base = 880;
            else if (val.includes(q)) base = 700;
            else if (q.length >= 2 && findSubsequenceIndices(text, q)) {
                base = 380;
                fuzzy = true;
            } else if (q.length >= 3 && findTypoMatchIndices(text, q)) {
                base = 280;
                fuzzy = true;
            }

            const weighted = base * weight;
            if (weighted > bestScore) {
                bestScore = weighted;
                bestIsFuzzy = fuzzy;
            }
        }

        return { score: bestScore, isFuzzy: bestIsFuzzy };
    }

    // ==========================================
    // 3. SITE-WIDE SEARCH INDEX (PAGES, SETTINGS, INFO, CHARTS)
    // ==========================================
    function detectChartsDirectoryUrl() {
        // ตรวจสอบจากเมนูในหน้าปัจจุบันว่าแยกหน้า charts.html หรือใช้ index.html เป็นหน้าหลัก
        const hasDedicatedChartsLink = Boolean(
            document.querySelector('.menu-card button[onclick*="charts.html"], a[href="charts.html"]')
        );
        return hasDedicatedChartsLink ? "charts.html" : "index.html";
    }

    function buildStaticSearchItems() {
        const chartsDirUrl = detectChartsDirectoryUrl();
        const items = [];

        // --- PAGES ---
        if (chartsDirUrl === "charts.html") {
            items.push({
                category: "Pages",
                type: "page",
                badge: "PAGE",
                title: "Home",
                subtitle: "Featured airport previews & quick overview",
                href: "index.html",
                keywords: "home main overview preview carousel featured หน้าแรก หน้าหลัก"
            });
        }

        items.push(
            {
                category: "Pages",
                type: "page",
                badge: "PAGE",
                title: "WoA Charts Directory",
                subtitle: "Browse all airport ground charts & taxi layouts",
                href: chartsDirUrl,
                keywords: "charts directory airport list taxiway stand map ตารางสนามบิน ผังสนามบิน รายชื่อสนามบิน"
            },
            {
                category: "Pages",
                type: "page",
                badge: "PAGE",
                title: "Credits & Disclaimer",
                subtitle: "Chart sources (WoA Info), usage policy & developer info",
                href: "credits.html",
                keywords: "credits source woainfo disclaimer policy github edwardmarico เครดิต แหล่งที่มา ผู้พัฒนา"
            },
            {
                category: "Pages",
                type: "page",
                badge: "PAGE",
                title: "Settings",
                subtitle: "Customize theme, animations & reset preferences",
                href: "settings.html",
                keywords: "settings preferences options config appearance system ตั้งค่า การตั้งค่า ตัวเลือก"
            }
        );

        // --- SETTINGS & QUICK ACTIONS ---
        items.push(
            {
                category: "Settings",
                type: "setting",
                badge: "SETTING",
                title: "Dark Mode",
                getSubtitle: () => {
                    const isDark = (localStorage.getItem("app_theme") || "light") === "dark";
                    return `Appearance • Currently ${isDark ? "Enabled (Dark)" : "Disabled (Light)"}`;
                },
                href: "settings.html?highlight=dark-mode",
                keywords: "dark mode light mode theme appearance night color scheme โหมดมืด โหมดสว่าง ธีม สีเข้ม",
                quickActionLabel: "Toggle",
                onQuickAction: () => {
                    const isDark = (localStorage.getItem("app_theme") || "light") === "dark";
                    const nextDark = !isDark;
                    localStorage.setItem("app_theme", nextDark ? "dark" : "light");
                    document.documentElement.classList.toggle("dark-mode", nextDark);
                    document.body.classList.toggle("dark-mode", nextDark);
                    const toggleEl = document.getElementById("toggleDarkMode");
                    if (toggleEl) toggleEl.checked = nextDark;
                }
            },
            {
                category: "Settings",
                type: "setting",
                badge: "SETTING",
                title: "Page & UI Animations",
                getSubtitle: () => {
                    const isAnim = localStorage.getItem("setting_enableAnimation") !== "false";
                    return `Appearance • Currently ${isAnim ? "Enabled" : "Disabled"}`;
                },
                href: "settings.html?highlight=animations",
                keywords: "page ui animations transitions motion effects reduce motion แอนิเมชัน เอฟเฟกต์ การเคลื่อนไหว",
                quickActionLabel: "Toggle",
                onQuickAction: () => {
                    const isAnim = localStorage.getItem("setting_enableAnimation") !== "false";
                    const nextAnim = !isAnim;
                    localStorage.setItem("setting_enableAnimation", nextAnim ? "true" : "false");
                    document.body.classList.toggle("no-animations", !nextAnim);
                    const toggleEl = document.getElementById("toggleAnimation");
                    if (toggleEl) toggleEl.checked = nextAnim;
                }
            },
            {
                category: "Settings",
                type: "setting",
                badge: "SETTING",
                title: "Reset All Settings",
                subtitle: "System & Data • Restore default preferences",
                href: "settings.html?highlight=reset",
                keywords: "reset all settings default clear data restore factory รีเซ็ต คืนค่าเริ่มต้น ล้างการตั้งค่า"
            }
        );

        // --- CREDITS / INFO SECTIONS ---
        items.push(
            {
                category: "Info & Credits",
                type: "info",
                badge: "INFO",
                title: "Airport Charts Source (WoA Info)",
                subtitle: "Credits • Original chart reference diagrams source",
                href: "credits.html?highlight=source",
                keywords: "woainfo google sites source original creators แหล่งข้อมูล ต้นฉบับ"
            },
            {
                category: "Info & Credits",
                type: "info",
                badge: "INFO",
                title: "Non-Commercial Use Policy",
                subtitle: "Credits • Fan-made community gameplay utility policy",
                href: "credits.html?highlight=policy",
                keywords: "non-commercial policy disclaimer copyright license นโยบาย ลิขสิทธิ์"
            },
            {
                category: "Info & Credits",
                type: "info",
                badge: "INFO",
                title: "Developer & Contact (EdwardMarico)",
                subtitle: "Credits • GitHub repository & email contact",
                href: "credits.html?highlight=developer",
                keywords: "edwardmarico github email contact developer ผู้พัฒนา ติดต่อ"
            }
        );

        return items;
    }

    function normalizeAirportCharts(airport) {
        if (Array.isArray(airport.charts) && airport.charts.length > 0) {
            return airport.charts
                .filter((c) => c && c.file)
                .map((c, idx) => ({
                    name: (c.name || `Taxi Layout ${idx + 1}`).trim(),
                    file: String(c.file).trim()
                }));
        }
        if (airport.file) {
            return [{
                name: (airport.chartName || "Airport Chart").trim(),
                file: String(airport.file).trim()
            }];
        }
        return [];
    }

    async function loadAirportSearchItems() {
        try {
            const response = await fetch("charts-data.json");
            if (!response.ok) return { rawAirports: [], searchItems: [] };
            const parsed = await response.json();
            if (!Array.isArray(parsed)) return { rawAirports: [], searchItems: [] };

            const searchItems = [];
            parsed.forEach((airport) => {
                const iata = (airport.iata || "").trim().toUpperCase();
                const name = (airport.name || "").trim();
                const location = (airport.location || "").trim();
                const charts = normalizeAirportCharts(airport);
                const subNames = charts.map((c) => c.name).join(" ");

                // รายการหลักของสนามบิน
                searchItems.push({
                    category: "Airport Charts",
                    type: "airport",
                    badge: iata,
                    title: name,
                    subtitle: location,
                    href: `viewer.html?iata=${encodeURIComponent(iata)}`,
                    taxiCount: charts.length,
                    keywords: `${iata} ${name} ${location} ${subNames} airport chart สนามบิน`
                });

                // ถ้าสนามบินมีหลายผัง Taxi ให้ค้นหาผังย่อยได้โดยตรงด้วย
                if (charts.length > 1) {
                    charts.forEach((chartItem, idx) => {
                        searchItems.push({
                            category: "Airport Charts",
                            type: "taxi",
                            badge: `${iata} #${idx + 1}`,
                            title: `${iata} — ${chartItem.name}`,
                            subtitle: `${name} • ${location}`,
                            href: `viewer.html?iata=${encodeURIComponent(iata)}&chart=${idx}`,
                            keywords: `${iata} ${name} ${location} ${chartItem.name} taxi layout apron`
                        });
                    });
                }
            });

            return { rawAirports: parsed, searchItems };
        } catch (err) {
            console.warn("Global Search: Could not load charts-data.json", err);
            return { rawAirports: [], searchItems: [] };
        }
    }

    // ==========================================
    // 4. DEEP-LINK HIGHLIGHT HANDLER (FOR SETTINGS & CREDITS)
    // ==========================================
    function handleIncomingHighlight() {
        const params = new URLSearchParams(window.location.search);
        const targetKey = (params.get("highlight") || "").trim().toLowerCase();
        if (!targetKey) return;

        const keywordMap = {
            "dark-mode": ["dark mode"],
            "animations": ["animations", "page & ui"],
            "reset": ["reset all settings", "reset"],
            "source": ["airport charts source", "woa info"],
            "policy": ["non-commercial", "use policy"],
            "developer": ["website development", "edwardmarico"]
        };

        const searchTerms = keywordMap[targetKey] || [targetKey];
        const candidates = document.querySelectorAll(".setting-item, .settings-card");

        for (const el of candidates) {
            const text = el.textContent.toLowerCase();
            if (searchTerms.some((term) => text.includes(term))) {
                setTimeout(() => {
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                    el.classList.add("naj-search-target-highlight");
                }, 180);
                break;
            }
        }
    }

    // ==========================================
    // 5. TOPBAR SEARCH UI INJECTION & CONTROLLER
    // ==========================================
    function ensureSearchBarDOM() {
        let searchBox = document.getElementById("topbarSearchBox");
        if (searchBox) return searchBox;

        const topbarCenter = document.querySelector(".topbar-center");
        if (!topbarCenter) return null;

        topbarCenter.innerHTML = `
            <div class="topbar-search" id="topbarSearchBox">
                <span class="search-icon" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </span>
                <input
                    type="text"
                    id="topbarSearchInput"
                    placeholder="Search airports, pages, settings... ( / )"
                    autocomplete="off"
                    aria-label="Search site"
                    aria-expanded="false"
                    aria-controls="searchDropdown"
                >
                <button type="button" id="clearSearchBtn" class="clear-search-btn" title="Clear search" aria-label="Clear search">&times;</button>
                <div class="search-dropdown" id="searchDropdown" role="listbox" aria-label="Search suggestions"></div>
            </div>
        `;

        return document.getElementById("topbarSearchBox");
    }

    const searchListeners = new Set();
    let cachedRawAirports = [];

    // เปิด API ให้หน้าอื่นๆ (เช่น charts_2.html) เรียกใช้ฟังก์ชันค้นหาและไฮไลท์ร่วมกันได้
    window.NAJSearch = {
        scoreTextFields,
        buildHighlightedFragment,
        onSearch(callback) {
            if (typeof callback === "function") searchListeners.add(callback);
        },
        getAirports() {
            return cachedRawAirports;
        }
    };

    document.addEventListener("DOMContentLoaded", async () => {
        handleIncomingHighlight();

        const topbarSearchBox = ensureSearchBarDOM();
        if (!topbarSearchBox) return;

        const searchInput = document.getElementById("topbarSearchInput");
        const clearSearchBtn = document.getElementById("clearSearchBtn");
        const searchDropdown = document.getElementById("searchDropdown");

        // อัปเดต placeholder ให้สื่อว่าหาได้ทุกอย่าง
        if (searchInput) {
            searchInput.placeholder = "Search airports, pages, settings...";
        }

        const staticItems = buildStaticSearchItems();
        const { rawAirports, searchItems: airportItems } = await loadAirportSearchItems();
        cachedRawAirports = rawAirports;
        const allSearchItems = [...staticItems, ...airportItems];

        let activeDropdownIndex = -1;
        let currentDropdownLinks = [];
        let searchDebounceTimer = null;
        let dropdownCloseTimer = null;

        function adjustDropdownBounds() {
            if (!searchDropdown || !topbarSearchBox) return;
            searchDropdown.style.setProperty("--dropdown-shift-x", "0px");
            const rect = searchDropdown.getBoundingClientRect();
            const margin = 12;
            let shift = 0;

            if (rect.left < margin) {
                shift = margin - rect.left;
            } else if (rect.right > window.innerWidth - margin) {
                shift = (window.innerWidth - margin) - rect.right;
            }
            searchDropdown.style.setProperty("--dropdown-shift-x", `${shift}px`);
        }

        function openDropdown() {
            if (dropdownCloseTimer) {
                clearTimeout(dropdownCloseTimer);
                dropdownCloseTimer = null;
            }
            adjustDropdownBounds();
            searchDropdown.classList.add("open");
            searchInput.setAttribute("aria-expanded", "true");
        }

        function closeDropdown(immediate = false) {
            if (dropdownCloseTimer) {
                clearTimeout(dropdownCloseTimer);
                dropdownCloseTimer = null;
            }
            const performClose = () => {
                searchDropdown.classList.remove("open");
                searchInput.setAttribute("aria-expanded", "false");
                activeDropdownIndex = -1;
            };

            if (immediate || document.body.classList.contains("no-animations")) {
                performClose();
            } else {
                dropdownCloseTimer = setTimeout(performClose, 90);
            }
        }

        window.addEventListener("resize", () => {
            if (searchDropdown.classList.contains("open")) {
                adjustDropdownBounds();
            }
        });

        document.addEventListener("click", (e) => {
            if (!topbarSearchBox.contains(e.target)) {
                closeDropdown(false);
            }
        });

        // ซ่อนช่องค้นหานุ่มนวลเมื่อเปิด Hamburger Menu
        const hamburgerMenu = document.getElementById("hamburgerMenu");
        if (hamburgerMenu) {
            let menuSyncTimer = null;
            const syncSearchVisibility = () => {
                if (menuSyncTimer) clearTimeout(menuSyncTimer);
                const isMenuOpen = hamburgerMenu.classList.contains("active");
                if (isMenuOpen) {
                    topbarSearchBox.classList.add("menu-opened");
                    closeDropdown(true);
                } else {
                    menuSyncTimer = setTimeout(() => {
                        topbarSearchBox.classList.remove("menu-opened");
                    }, 110);
                }
            };
            hamburgerMenu.addEventListener("click", () => setTimeout(syncSearchVisibility, 15));
            document.addEventListener("click", () => setTimeout(syncSearchVisibility, 15));
        }

        function updateActiveDropdownItem() {
            currentDropdownLinks.forEach((el, idx) => {
                const isActive = idx === activeDropdownIndex;
                el.classList.toggle("is-active", isActive);
                if (isActive) {
                    el.scrollIntoView({ block: "nearest", behavior: "smooth" });
                }
            });
        }

        function navigateItem(href) {
            if (typeof window.navigateTo === "function") {
                window.navigateTo(href);
            } else {
                window.location.href = href;
            }
        }

        function renderGlobalDropdown(rawQuery) {
            const query = rawQuery.trim();
            searchDropdown.innerHTML = "";
            currentDropdownLinks = [];
            activeDropdownIndex = -1;

            if (!query) {
                closeDropdown(false);
                return;
            }

            const matched = [];
            for (const item of allSearchItems) {
                const subText = typeof item.getSubtitle === "function" ? item.getSubtitle() : item.subtitle;
                const { score, isFuzzy } = scoreTextFields(
                    [
                        { text: item.badge, weight: 1.25 },
                        { text: item.title, weight: 1.15 },
                        { text: subText, weight: 0.95 },
                        { text: item.keywords, weight: 0.9 }
                    ],
                    query
                );

                if (score > 0) {
                    matched.push({ item, subText, score, isFuzzy });
                }
            }

            matched.sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title));

            if (matched.length === 0) {
                const emptyDiv = document.createElement("div");
                emptyDiv.className = "search-dropdown-empty";
                emptyDiv.textContent = `No results found for "${query}"`;
                searchDropdown.appendChild(emptyDiv);
                openDropdown();
                return;
            }

            const header = document.createElement("div");
            header.className = "search-dropdown-header";
            header.innerHTML = `
                <span>Results (${matched.length})</span>
                <span class="search-dropdown-hint">↑↓ select · Enter open</span>
            `;
            searchDropdown.appendChild(header);

            // จัดกลุ่มตามหมวดหมู่ (Pages, Settings, Info & Credits, Airport Charts) สูงสุด 10 รายการ
            const topMatches = matched.slice(0, 10);
            const categoryOrder = ["Pages", "Settings", "Info & Credits", "Airport Charts"];
            let itemAnimIndex = 0;

            categoryOrder.forEach((catName) => {
                const groupItems = topMatches.filter((m) => m.item.category === catName);
                if (groupItems.length === 0) return;

                const groupLabel = document.createElement("div");
                groupLabel.className = "search-dropdown-group-label";
                groupLabel.textContent = catName;
                searchDropdown.appendChild(groupLabel);

                groupItems.forEach(({ item, subText, isFuzzy }) => {
                    const currentIdx = itemAnimIndex++;
                    const itemLink = document.createElement("a");
                    itemLink.href = item.href;
                    itemLink.className = "search-dropdown-item";
                    itemLink.style.setProperty("--drop-index", currentIdx);
                    itemLink.setAttribute("role", "option");

                    const leftWrap = document.createElement("div");
                    leftWrap.className = "dropdown-item-left";

                    const badgeEl = document.createElement("span");
                    if (item.type === "airport") {
                        badgeEl.className = "dropdown-iata-tag";
                    } else {
                        badgeEl.className = `dropdown-type-badge is-${item.type}`;
                    }
                    badgeEl.appendChild(buildHighlightedFragment(item.badge, query));

                    const textWrap = document.createElement("div");
                    textWrap.className = "dropdown-item-text";

                    const titleSpan = document.createElement("span");
                    titleSpan.className = "dropdown-airport-name";
                    titleSpan.appendChild(buildHighlightedFragment(item.title, query));

                    const subSpan = document.createElement("span");
                    subSpan.className = "dropdown-airport-location";
                    subSpan.appendChild(buildHighlightedFragment(subText, query));

                    textWrap.append(titleSpan, subSpan);
                    leftWrap.append(badgeEl, textWrap);
                    itemLink.appendChild(leftWrap);

                    // ปุ่มสลับค่าด่วนสำหรับ Settings (เช่น Dark Mode / Animations)
                    if (typeof item.onQuickAction === "function") {
                        const quickBtn = document.createElement("button");
                        quickBtn.type = "button";
                        quickBtn.className = "search-quick-toggle-btn";
                        quickBtn.textContent = item.quickActionLabel || "Toggle";
                        quickBtn.title = `Quick toggle ${item.title}`;
                        quickBtn.addEventListener("click", (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            item.onQuickAction();
                            // อัปเดตข้อความสถานะใน Dropdown ทันที
                            subSpan.replaceChildren(
                                buildHighlightedFragment(item.getSubtitle(), query)
                            );
                        });
                        itemLink.appendChild(quickBtn);
                    } else if (item.taxiCount > 1) {
                        const multiTag = document.createElement("span");
                        multiTag.className = "dropdown-taxi-count-badge";
                        multiTag.textContent = `${item.taxiCount} Taxi`;
                        itemLink.appendChild(multiTag);
                    } else if (isFuzzy) {
                        const fuzzyBadge = document.createElement("span");
                        fuzzyBadge.className = "dropdown-match-badge";
                        fuzzyBadge.textContent = "Similar";
                        itemLink.appendChild(fuzzyBadge);
                    }

                    itemLink.addEventListener("mouseenter", () => {
                        activeDropdownIndex = currentIdx;
                        updateActiveDropdownItem();
                    });

                    itemLink.addEventListener("click", (e) => {
                        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
                        e.preventDefault();
                        closeDropdown(true);
                        navigateItem(item.href);
                    });

                    searchDropdown.appendChild(itemLink);
                    currentDropdownLinks.push(itemLink);
                });
            });

            openDropdown();
        }

        function notifySearchListeners(query) {
            searchListeners.forEach((cb) => {
                try {
                    cb(query);
                } catch (err) {
                    console.error(err);
                }
            });
        }

        searchInput.addEventListener("input", (e) => {
            const val = e.target.value;
            clearSearchBtn.classList.toggle("visible", val.length > 0);

            if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                renderGlobalDropdown(val);
                notifySearchListeners(val);
            }, 85);
        });

        searchInput.addEventListener("focus", () => {
            if (searchInput.value.trim().length > 0) {
                renderGlobalDropdown(searchInput.value);
            }
        });

        searchInput.addEventListener("keydown", (e) => {
            if (!searchDropdown.classList.contains("open")) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                if (currentDropdownLinks.length > 0) {
                    activeDropdownIndex = (activeDropdownIndex + 1) % currentDropdownLinks.length;
                    updateActiveDropdownItem();
                }
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                if (currentDropdownLinks.length > 0) {
                    activeDropdownIndex =
                        (activeDropdownIndex - 1 + currentDropdownLinks.length) % currentDropdownLinks.length;
                    updateActiveDropdownItem();
                }
            } else if (e.key === "Enter") {
                if (currentDropdownLinks.length > 0) {
                    e.preventDefault();
                    const targetLink =
                        activeDropdownIndex >= 0
                            ? currentDropdownLinks[activeDropdownIndex]
                            : currentDropdownLinks[0];
                    targetLink.click();
                }
            } else if (e.key === "Escape") {
                closeDropdown(true);
            }
        });

        const clearSearch = () => {
            if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
            searchInput.value = "";
            clearSearchBtn.classList.remove("visible");
            closeDropdown(true);
            notifySearchListeners("");
            searchInput.focus();
        };

        clearSearchBtn.addEventListener("click", clearSearch);

        // ปุ่ม Reset ในหน้า Directory (ถ้ามี)
        const resetSearchStateBtn = document.getElementById("resetSearchStateBtn");
        if (resetSearchStateBtn) {
            resetSearchStateBtn.addEventListener("click", clearSearch);
        }

        // คีย์ลัด "/" หรือ "Ctrl + K" เพื่อเปิดช่องค้นหาจากทุกที่ในหน้าเว็บ
        document.addEventListener("keydown", (e) => {
            const activeTag = document.activeElement?.tagName;
            const isTyping = activeTag === "INPUT" || activeTag === "TEXTAREA" || document.activeElement?.isContentEditable;

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                searchInput.focus();
                searchInput.select();
            } else if (!isTyping && e.key === "/") {
                e.preventDefault();
                searchInput.focus();
            }
        });
    });
})();