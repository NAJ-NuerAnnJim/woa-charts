/**
 * Custom Context Menu for NAJ - WoA Charts
 * Replaces the default browser right-click menu with a custom UI
 * across the entire site (including text inputs) and supports
 * downloading airport charts directly from the viewer.
 */
(function () {
    "use strict";

    // ==========================================
    // 1. INJECT STYLES (SELF-CONTAINED)
    // ==========================================
    const styleId = "naj-custom-context-menu-styles";
    if (!document.getElementById(styleId)) {
        const styleEl = document.createElement("style");
        styleEl.id = styleId;
        styleEl.textContent = `
            .naj-ctx-menu {
                position: fixed;
                top: 0;
                left: 0;
                min-width: 224px;
                max-width: 280px;
                padding: 6px;
                background-color: rgba(255, 255, 255, 0.96);
                backdrop-filter: blur(14px);
                -webkit-backdrop-filter: blur(14px);
                border: 1px solid rgba(0, 0, 0, 0.09);
                border-radius: 12px;
                box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16), 0 2px 6px rgba(0, 0, 0, 0.06);
                z-index: 999999;
                display: flex;
                flex-direction: column;
                gap: 2px;
                user-select: none;
                opacity: 0;
                visibility: hidden;
                pointer-events: none;
                transform-origin: top left;
                transform: scale(0.95) translateY(-4px);
                transition:
                    opacity 0.18s cubic-bezier(0.22, 1, 0.36, 1),
                    transform 0.2s cubic-bezier(0.22, 1, 0.36, 1),
                    visibility 0.18s ease;
            }

            .naj-ctx-menu.is-open {
                opacity: 1;
                visibility: visible;
                pointer-events: auto;
                transform: scale(1) translateY(0);
            }

            /* Dark Mode & Viewer Page Dark Theme */
            html.dark-mode .naj-ctx-menu,
            body.dark-mode .naj-ctx-menu,
            body.viewer-page-body .naj-ctx-menu {
                background-color: rgba(26, 26, 32, 0.96);
                border-color: rgba(255, 255, 255, 0.12);
                box-shadow: 0 16px 38px rgba(0, 0, 0, 0.55), 0 2px 8px rgba(0, 0, 0, 0.3);
            }

            .naj-ctx-header {
                padding: 5px 10px 6px;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.04em;
                text-transform: uppercase;
                color: #64748b;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            html.dark-mode .naj-ctx-header,
            body.dark-mode .naj-ctx-header,
            body.viewer-page-body .naj-ctx-header {
                color: #94a3b8;
            }

            .naj-ctx-divider {
                height: 1px;
                margin: 4px 6px;
                background-color: rgba(0, 0, 0, 0.08);
            }

            html.dark-mode .naj-ctx-divider,
            body.dark-mode .naj-ctx-divider,
            body.viewer-page-body .naj-ctx-divider {
                background-color: rgba(255, 255, 255, 0.1);
            }

            .naj-ctx-item {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 8px 10px;
                border: none;
                border-radius: 8px;
                background: transparent;
                color: #18181c;
                font-family: inherit;
                font-size: 13px;
                font-weight: 500;
                text-align: left;
                cursor: pointer;
                transition:
                    background-color 0.16s ease,
                    color 0.16s ease,
                    transform 0.16s cubic-bezier(0.22, 1, 0.36, 1);
            }

            html.dark-mode .naj-ctx-item,
            body.dark-mode .naj-ctx-item,
            body.viewer-page-body .naj-ctx-item {
                color: #f4f4f6;
            }

            .naj-ctx-item:hover:not(:disabled) {
                background-color: rgba(37, 99, 235, 0.1);
                color: #1d4ed8;
            }

            html.dark-mode .naj-ctx-item:hover:not(:disabled),
            body.dark-mode .naj-ctx-item:hover:not(:disabled),
            body.viewer-page-body .naj-ctx-item:hover:not(:disabled) {
                background-color: rgba(59, 130, 246, 0.2);
                color: #93c5fd;
            }

            .naj-ctx-item:active:not(:disabled) {
                transform: scale(0.98);
            }

            .naj-ctx-item:disabled {
                opacity: 0.4;
                cursor: not-allowed;
            }

            .naj-ctx-item.is-primary {
                color: #2563eb;
                font-weight: 600;
            }

            html.dark-mode .naj-ctx-item.is-primary,
            body.dark-mode .naj-ctx-item.is-primary,
            body.viewer-page-body .naj-ctx-item.is-primary {
                color: #60a5fa;
            }

            .naj-ctx-item-left {
                display: flex;
                align-items: center;
                gap: 9px;
                min-width: 0;
            }

            .naj-ctx-icon {
                width: 15px;
                height: 15px;
                flex-shrink: 0;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                opacity: 0.85;
            }

            .naj-ctx-label {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .naj-ctx-shortcut {
                font-size: 11px;
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                color: #94a3b8;
                flex-shrink: 0;
            }

            /* Notification Toast */
            .naj-ctx-toast {
                position: fixed;
                bottom: 24px;
                right: 24px;
                background-color: #18181c;
                color: #ffffff;
                border: 1px solid rgba(255, 255, 255, 0.12);
                padding: 10px 16px;
                border-radius: 9px;
                font-size: 13px;
                font-weight: 500;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
                z-index: 1000000;
                opacity: 0;
                transform: translateY(12px);
                pointer-events: none;
                transition:
                    opacity 0.25s cubic-bezier(0.22, 1, 0.36, 1),
                    transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
            }

            .naj-ctx-toast.is-visible {
                opacity: 1;
                transform: translateY(0);
            }
        `;
        document.head.appendChild(styleEl);
    }

    // ==========================================
    // 2. ICONS & HELPERS
    // ==========================================
    const ICONS = {
        download: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
        zoomIn: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`,
        zoomOut: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`,
        rotateRight: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>`,
        rotateLeft: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`,
        reset: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v6h6"/><path d="M3 13a9 9 0 1 0 3-7.7L3 8"/></svg>`,
        back: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
        reload: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
        theme: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
        external: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
        copy: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
        cut: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>`,
        paste: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>`,
        selectAll: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>`,
        clear: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
        map: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>`,
        settings: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
    };

    const TEXT_INPUT_TYPES = new Set([
        "text",
        "search",
        "email",
        "url",
        "tel",
        "password",
        "number"
    ]);

    let toastTimer = null;
    function showToast(message) {
        let toast = document.getElementById("najCtxToast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "najCtxToast";
            toast.className = "naj-ctx-toast";
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add("is-visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.classList.remove("is-visible");
        }, 2000);
    }

    function goToPage(url) {
        if (typeof window.navigateTo === "function") {
            window.navigateTo(url);
        } else {
            window.location.href = url;
        }
    }

    async function writeClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            try {
                const ta = document.createElement("textarea");
                ta.value = text;
                ta.style.position = "fixed";
                ta.style.opacity = "0";
                document.body.appendChild(ta);
                ta.select();
                const ok = document.execCommand("copy");
                document.body.removeChild(ta);
                return ok;
            } catch {
                return false;
            }
        }
    }

    function replaceInputRange(inputEl, replacement, start, end) {
        inputEl.focus();
        if (typeof inputEl.setRangeText === "function") {
            inputEl.setRangeText(replacement, start, end, "end");
        } else {
            const current = inputEl.value || "";
            inputEl.value = current.slice(0, start) + replacement + current.slice(end);
            const cursor = start + replacement.length;
            if (typeof inputEl.setSelectionRange === "function") {
                inputEl.setSelectionRange(cursor, cursor);
            }
        }
        inputEl.dispatchEvent(new Event("input", { bubbles: true }));
    }

    function getTextInputTarget(target) {
        const el = target.closest("input, textarea");
        if (!el) return null;
        if (el.tagName === "TEXTAREA") return el;
        const type = (el.type || "text").toLowerCase();
        return TEXT_INPUT_TYPES.has(type) ? el : null;
    }

    /**
     * Download an image file cleanly using Blob (with direct-link fallback).
     */
    async function downloadImageFile(imageUrl, suggestedName) {
        if (!imageUrl) {
            showToast("No image available to download");
            return;
        }

        const cleanUrl = imageUrl.split("?")[0].split("#")[0];
        const extMatch = cleanUrl.match(/\.(png|jpg|jpeg|webp|gif|svg)$/i);
        const ext = extMatch ? extMatch[0].toLowerCase() : ".png";

        const safeBase = (suggestedName || "airport-chart")
            .replace(/[^a-zA-Z0-9_-]+/g, "-")
            .replace(/^-+|-+$/g, "");
        const filename = safeBase.toLowerCase().endsWith(ext) ? safeBase : `${safeBase}${ext}`;

        showToast(`Downloading ${filename}...`);

        try {
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error("Network response was not ok");
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
        } catch (err) {
            const link = document.createElement("a");
            link.href = imageUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    function toggleDarkMode() {
        const isDark = (localStorage.getItem("app_theme") || "light") === "dark";
        const nextDark = !isDark;
        localStorage.setItem("app_theme", nextDark ? "dark" : "light");

        document.documentElement.classList.toggle("dark-mode", nextDark);
        document.body.classList.toggle("dark-mode", nextDark);

        const settingsToggle = document.getElementById("toggleDarkMode");
        if (settingsToggle) {
            settingsToggle.checked = nextDark;
        }

        showToast(nextDark ? "Dark Mode enabled" : "Light Mode enabled");
    }

    // ==========================================
    // 3. BUILD & POSITION CUSTOM CONTEXT MENU
    // ==========================================
    const menuEl = document.createElement("div");
    menuEl.id = "najCustomContextMenu";
    menuEl.className = "naj-ctx-menu";
    menuEl.setAttribute("role", "menu");
    document.body.appendChild(menuEl);

    function closeContextMenu() {
        menuEl.classList.remove("is-open");
    }

    function buildMenuItems(e) {
        const items = [];
        const target = e.target;

        // 1. Check if user right-clicked a text input / textarea
        const textInput = getTextInputTarget(target);
        if (textInput) {
            const val = textInput.value || "";
            const start = typeof textInput.selectionStart === "number" ? textInput.selectionStart : val.length;
            const end = typeof textInput.selectionEnd === "number" ? textInput.selectionEnd : val.length;
            const hasSelection = end > start;
            const selectedVal = hasSelection ? val.slice(start, end) : "";
            const isEditable = !textInput.disabled && !textInput.readOnly;

            items.push({ type: "header", label: "Text Field" });
            items.push({
                label: "Cut",
                icon: ICONS.cut,
                shortcut: "Ctrl+X",
                disabled: !hasSelection || !isEditable,
                action: async () => {
                    const copied = await writeClipboard(selectedVal);
                    if (copied) {
                        replaceInputRange(textInput, "", start, end);
                        showToast("Cut to clipboard");
                    } else {
                        showToast("Unable to cut text");
                    }
                }
            });
            items.push({
                label: "Copy",
                icon: ICONS.copy,
                shortcut: "Ctrl+C",
                disabled: !hasSelection,
                action: async () => {
                    const copied = await writeClipboard(selectedVal);
                    textInput.focus();
                    if (typeof textInput.setSelectionRange === "function") {
                        textInput.setSelectionRange(start, end);
                    }
                    showToast(copied ? "Copied to clipboard" : "Unable to copy");
                }
            });
            items.push({
                label: "Paste",
                icon: ICONS.paste,
                shortcut: "Ctrl+V",
                disabled: !isEditable,
                action: async () => {
                    try {
                        const clipText = await navigator.clipboard.readText();
                        replaceInputRange(textInput, clipText, start, end);
                    } catch {
                        textInput.focus();
                        if (typeof textInput.setSelectionRange === "function") {
                            textInput.setSelectionRange(start, end);
                        }
                        showToast("Press Ctrl+V to paste");
                    }
                }
            });
            items.push({ type: "divider" });
            items.push({
                label: "Select All",
                icon: ICONS.selectAll,
                shortcut: "Ctrl+A",
                disabled: val.length === 0,
                action: () => {
                    textInput.focus();
                    textInput.select();
                }
            });
            items.push({
                label: "Clear",
                icon: ICONS.clear,
                disabled: val.length === 0 || !isEditable,
                action: () => {
                    replaceInputRange(textInput, "", 0, val.length);
                }
            });

            return items;
        }

        // 2. Check if user right-clicked inside the Chart Viewer page (viewer.html)
        const viewerImage = document.getElementById("viewerImage");
        const isViewerPage = Boolean(document.getElementById("chartViewerPage") || document.body.classList.contains("viewer-page-body"));
        const clickedViewerChart =
            isViewerPage &&
            viewerImage &&
            viewerImage.src &&
            viewerImage.style.display !== "none" &&
            (target === viewerImage || Boolean(target.closest("#viewerStage")));

        if (clickedViewerChart) {
            const iataText = (document.getElementById("viewerIata")?.textContent || "CHART").trim();
            const titleText = (document.getElementById("viewerTitle")?.textContent || "").trim();
            const taxiName = (viewerImage.dataset.chartName || "").trim();
            const basePrefix = iataText && iataText !== "---" && iataText !== "N/A"
                ? iataText
                : (titleText || "Airport");
            const fileName = taxiName
                ? `${basePrefix}-${taxiName}-Chart`
                : `${basePrefix}-Airport-Chart`;

            items.push({ type: "header", label: `${iataText} Chart Viewer` });
            items.push({
                label: "Download Chart",
                icon: ICONS.download,
                primary: true,
                action: () => downloadImageFile(viewerImage.src, fileName)
            });
            items.push({ type: "divider" });
            items.push({
                label: "Zoom In",
                icon: ICONS.zoomIn,
                shortcut: "+",
                action: () => document.getElementById("zoomInBtn")?.click()
            });
            items.push({
                label: "Zoom Out",
                icon: ICONS.zoomOut,
                shortcut: "-",
                action: () => document.getElementById("zoomOutBtn")?.click()
            });
            items.push({
                label: "Rotate 90° Right",
                icon: ICONS.rotateRight,
                shortcut: "R",
                action: () => document.getElementById("rotateRightBtn")?.click()
            });
            items.push({
                label: "Rotate 90° Left",
                icon: ICONS.rotateLeft,
                shortcut: "Shift+R",
                action: () => document.getElementById("rotateLeftBtn")?.click()
            });
            items.push({
                label: "Reset View",
                icon: ICONS.reset,
                shortcut: "0",
                action: () => document.getElementById("zoomResetBtn")?.click()
            });
            items.push({ type: "divider" });
            items.push({
                label: "Back to Directory",
                icon: ICONS.back,
                shortcut: "ESC",
                action: () => goToPage("index.html")
            });

            return items;
        }

        // 3. Check if user right-clicked an airport chart card on index.html
        const chartCard = target.closest(".chart-list-item");
        if (chartCard) {
            const href = chartCard.getAttribute("href");
            const iata = (chartCard.querySelector(".chart-iata-tag")?.textContent || "CHART").trim();
            const thumbImg = chartCard.querySelector(".chart-thumb-box img");
            const imgSrc = chartCard.dataset.file || (thumbImg ? thumbImg.src : "");

            items.push({ type: "header", label: `${iata} Airport Chart` });
            if (href) {
                items.push({
                    label: "Open Chart",
                    icon: ICONS.map,
                    primary: true,
                    action: () => goToPage(href)
                });
                items.push({
                    label: "Open in New Tab",
                    icon: ICONS.external,
                    action: () => window.open(href, "_blank", "noopener,noreferrer")
                });
            }
            if (imgSrc) {
                items.push({
                    label: "Download Chart",
                    icon: ICONS.download,
                    action: () => downloadImageFile(imgSrc, `${iata}-Airport-Chart`)
                });
            }
            items.push({ type: "divider" });
        }

        // 4. Check if user right-clicked a standard link
        const linkEl = !chartCard ? target.closest("a[href]") : null;
        if (linkEl) {
            const href = linkEl.getAttribute("href");
            if (href && !href.startsWith("javascript:")) {
                items.push({
                    label: "Open Link in New Tab",
                    icon: ICONS.external,
                    action: () => window.open(linkEl.href, "_blank", "noopener,noreferrer")
                });
                items.push({
                    label: "Copy Link Address",
                    icon: ICONS.copy,
                    action: async () => {
                        const copied = await writeClipboard(linkEl.href);
                        showToast(copied ? "Link copied to clipboard" : "Unable to copy link");
                    }
                });
                items.push({ type: "divider" });
            }
        }

        // 5. Check if text is selected on page
        const selectedText = window.getSelection ? window.getSelection().toString().trim() : "";
        if (selectedText) {
            items.push({
                label: "Copy Selected Text",
                icon: ICONS.copy,
                shortcut: "Ctrl+C",
                action: async () => {
                    const copied = await writeClipboard(selectedText);
                    showToast(copied ? "Copied to clipboard" : "Unable to copy");
                }
            });
            items.push({ type: "divider" });
        }

        // 6. General Navigation & Theme Controls
        if (!chartCard && !linkEl && !selectedText) {
            items.push({ type: "header", label: "NAJ - WoA Charts" });
        }

        items.push({
            label: "Back",
            icon: ICONS.back,
            action: () => window.history.back()
        });
        items.push({
            label: "Reload Page",
            icon: ICONS.reload,
            shortcut: "F5",
            action: () => window.location.reload()
        });

        const isDark = (localStorage.getItem("app_theme") || "light") === "dark";
        items.push({
            label: isDark ? "Switch to Light Mode" : "Switch to Dark Mode",
            icon: ICONS.theme,
            action: toggleDarkMode
        });

        items.push({ type: "divider" });
        items.push({
            label: "WoA Charts Directory",
            icon: ICONS.map,
            action: () => goToPage("index.html")
        });
        items.push({
            label: "Settings",
            icon: ICONS.settings,
            action: () => goToPage("settings.html")
        });

        return items;
    }

    function openContextMenu(e) {
        e.preventDefault();

        const items = buildMenuItems(e);
        menuEl.innerHTML = "";

        items.forEach((item) => {
            if (item.type === "header") {
                const header = document.createElement("div");
                header.className = "naj-ctx-header";
                header.textContent = item.label;
                menuEl.appendChild(header);
                return;
            }

            if (item.type === "divider") {
                const divider = document.createElement("div");
                divider.className = "naj-ctx-divider";
                menuEl.appendChild(divider);
                return;
            }

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = `naj-ctx-item${item.primary ? " is-primary" : ""}`;
            btn.setAttribute("role", "menuitem");
            if (item.disabled) btn.disabled = true;

            const left = document.createElement("span");
            left.className = "naj-ctx-item-left";

            if (item.icon) {
                const iconSpan = document.createElement("span");
                iconSpan.className = "naj-ctx-icon";
                iconSpan.innerHTML = item.icon;
                left.appendChild(iconSpan);
            }

            const labelSpan = document.createElement("span");
            labelSpan.className = "naj-ctx-label";
            labelSpan.textContent = item.label;
            left.appendChild(labelSpan);

            btn.appendChild(left);

            if (item.shortcut) {
                const shortcutSpan = document.createElement("span");
                shortcutSpan.className = "naj-ctx-shortcut";
                shortcutSpan.textContent = item.shortcut;
                btn.appendChild(shortcutSpan);
            }

            btn.addEventListener("click", (clickEvent) => {
                clickEvent.stopPropagation();
                closeContextMenu();
                if (typeof item.action === "function") {
                    item.action();
                }
            });

            menuEl.appendChild(btn);
        });

        // Position within viewport bounds
        menuEl.classList.add("is-open");
        const menuRect = menuEl.getBoundingClientRect();
        const padding = 10;

        let posX = e.clientX;
        let posY = e.clientY;
        let originX = "left";
        let originY = "top";

        if (posX + menuRect.width > window.innerWidth - padding) {
            posX = Math.max(padding, e.clientX - menuRect.width);
            originX = "right";
        }
        if (posY + menuRect.height > window.innerHeight - padding) {
            posY = Math.max(padding, e.clientY - menuRect.height);
            originY = "bottom";
        }

        menuEl.style.transformOrigin = `${originY} ${originX}`;
        menuEl.style.left = `${posX}px`;
        menuEl.style.top = `${posY}px`;
    }

    // ==========================================
    // 4. EVENT LISTENERS
    // ==========================================
    // Prevent losing text selection highlight inside inputs when clicking menu buttons
    menuEl.addEventListener("mousedown", (e) => {
        e.preventDefault();
    });

    document.addEventListener("contextmenu", openContextMenu);

    document.addEventListener("pointerdown", (e) => {
        if (!menuEl.contains(e.target)) {
            closeContextMenu();
        }
    });

    window.addEventListener("scroll", closeContextMenu, { passive: true });
    window.addEventListener("resize", closeContextMenu);
    window.addEventListener("blur", closeContextMenu);

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && menuEl.classList.contains("is-open")) {
            e.stopImmediatePropagation();
            closeContextMenu();
        }
    }, true);
})();
