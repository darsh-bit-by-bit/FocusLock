const BLOCK_MESSAGE = `
  <div style="
    display:flex;
    align-items:center;
    justify-content:center;
    height:100vh;
    font-family:sans-serif;
    font-size:20px;
    background:#000;
    color:#fff;
    text-align:center;
    padding:40px;
  ">
    YouTube Shorts are disabled during FocusLock.
  </div>
`;

let observerStarted = false;
let isLocked = false;
let shortsBlocked = false;
let styleInjected = false;

function checkLockStatus(callback) {
    chrome.storage.local.get(
        ["lockEndDate", "overrideUntil"],
        (data) => {
            const now = Date.now();
            const lockEnd = data.lockEndDate;
            const overrideUntil = data.overrideUntil;

            isLocked =
                lockEnd && now < lockEnd &&
                (!overrideUntil || now > overrideUntil);

            if (callback) callback(isLocked);
        }
    );
}

function isShortsPage() {
    return window.location.pathname.startsWith("/shorts");
}

function isHomePage() {
    const path = window.location.pathname;
    return path === "/" || path === "/feed/subscriptions" || path === "/feed/trending";
}

function isWatchPage() {
    return window.location.pathname === "/watch";
}

function injectHidingStyles() {
    if (styleInjected) return;
    styleInjected = true;

    const style = document.createElement("style");
    style.id = "focuslock-styles";
    style.textContent = `
        ytd-browse[page-subtype="home"] ytd-rich-grid-renderer,
        ytd-browse[page-subtype="subscriptions"] ytd-rich-grid-renderer,
        ytd-browse[page-subtype="home"] ytd-two-column-browse-results-renderer #primary,
        ytd-browse[page-subtype="subscriptions"] ytd-two-column-browse-results-renderer #primary {
            display: none !important;
        }
        
        #focuslock-message {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            z-index: 9999 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: transparent !important;
            pointer-events: none !important;
        }
    `;
    document.head.appendChild(style);
}

function removeHidingStyles() {
    const style = document.getElementById("focuslock-styles");
    if (style) {
        style.remove();
        styleInjected = false;
    }
}

function blockShortsPage() {
    if (isShortsPage() && !shortsBlocked) {
        shortsBlocked = true;

        window.stop();

        document.querySelectorAll("video").forEach(video => {
            video.pause();
            video.muted = true;
            video.src = "";
            video.load();
            video.remove();
        });

        document.querySelectorAll("audio").forEach(audio => {
            audio.pause();
            audio.src = "";
            audio.load();
            audio.remove();
        });

        document.documentElement.innerHTML = BLOCK_MESSAGE;

        document.querySelectorAll("script").forEach(script => script.remove());
    }
}

function removeShortsElements() {
    const selectors = [
        "ytd-reel-shelf-renderer",
        "ytd-rich-section-renderer",
        "ytd-reel-video-renderer",
        "a[href^='/shorts']",
        "ytd-guide-entry-renderer a[href='/shorts']",
        "ytd-mini-guide-entry-renderer a[href='/shorts']"
    ];

    selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => el.remove());
    });
}

function showHomepageMessage() {
    if (!isHomePage()) return;

    const existingMessage = document.getElementById("focuslock-message");
    if (existingMessage) return;

    const message = document.createElement("div");
    message.id = "focuslock-message";
    message.innerHTML = `
        <div style="text-align: center;">
            <h2 style="font-size: 24px; margin-bottom: 16px; color: #fff;">🎯 FocusLock Active</h2>
            <p style="font-size: 16px; opacity: 0.8; margin-bottom: 24px; color: #fff;">
                Homepage recommendations are hidden.<br>
                Use search to find specific videos.
            </p>
        </div>
    `;
    document.body.appendChild(message);
}

function hideHomepageMessage() {
    const message = document.getElementById("focuslock-message");
    if (message) {
        message.remove();
    }
}

function removeRecommendations() {
    const recommendationSelectors = [
        "ytd-watch-next-secondary-results-renderer",
        "#related",
        "ytd-compact-video-renderer",
        "ytd-shelf-renderer"
    ];

    if (isWatchPage()) {
        recommendationSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                el.style.display = "none";
            });
        });
    }
}

function disableAutoplay() {
    const autoplayButton = document.querySelector(".ytp-button[data-tooltip-target-id='ytp-autonav-toggle-button']");
    if (autoplayButton && autoplayButton.getAttribute("aria-checked") === "true") {
        autoplayButton.click();
    }
}

function hideComments() {
    const commentsSelector = "ytd-comments#comments";
    document.querySelectorAll(commentsSelector).forEach(el => {
        el.style.display = "none";
    });
}

function stopAllVideos() {
    document.querySelectorAll("video").forEach(video => {
        video.pause();
        video.muted = true;
        video.removeAttribute("src");
        video.load();
    });

    document.querySelectorAll("audio").forEach(audio => {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
    });
}

function enforceYouTubeRestrictions() {
    if (!isLocked) {
        removeHidingStyles();
        hideHomepageMessage();
        return;
    }

    if (isShortsPage()) {
        blockShortsPage();
        return;
    }

    removeShortsElements();

    if (isHomePage()) {
        injectHidingStyles();
        showHomepageMessage();
        stopAllVideos();
    } else {
        hideHomepageMessage();
    }

    removeRecommendations();
    disableAutoplay();
    hideComments();
}

function startObserver() {
    if (observerStarted) return;
    observerStarted = true;

    const observer = new MutationObserver(() => {
        if (isLocked) {
            enforceYouTubeRestrictions();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

if (window.location.pathname.startsWith("/shorts")) {
    checkLockStatus((locked) => {
        if (locked) {
            blockShortsPage();
        }
    });
}

checkLockStatus((locked) => {
    if (locked) {
        enforceYouTubeRestrictions();

        if (!isShortsPage()) {
            startObserver();
        }
    }
});

let lastUrl = location.href;
setInterval(() => {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        shortsBlocked = false;

        checkLockStatus((locked) => {
            if (locked) {
                enforceYouTubeRestrictions();
            }
        });
    }
}, 100);

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && (changes.lockEndDate || changes.overrideUntil)) {
        checkLockStatus((locked) => {
            if (locked) {
                enforceYouTubeRestrictions();
                if (!observerStarted && !isShortsPage()) {
                    startObserver();
                }
            } else {
                location.reload();
            }
        });
    }
});

document.addEventListener('play', (e) => {
    if (isLocked && (isShortsPage() || isHomePage())) {
        e.preventDefault();
        e.stopPropagation();
        if (e.target.tagName === 'VIDEO' || e.target.tagName === 'AUDIO') {
            e.target.pause();
            e.target.src = "";
        }
    }
}, true);
