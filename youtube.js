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

function blockShortsPage() {
    if (isShortsPage()) {
        document.documentElement.innerHTML = BLOCK_MESSAGE;
    }
}

function removeShortsElements() {
    const selectors = [
        "ytd-reel-shelf-renderer",
        "ytd-rich-section-renderer",
        "ytd-reel-video-renderer",
        "a[href^='/shorts']",
        "ytd-guide-entry-renderer a[href='/shorts']"
    ];

    selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => el.remove());
    });
}

function removeHomePageElements() {
    const homeSelectors = [
        "ytd-browse[page-subtype='home']",
        "ytd-two-column-browse-results-renderer",
        "#contents.ytd-rich-grid-renderer"
    ];

    homeSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            if (window.location.pathname === "/" || window.location.pathname === "/feed/subscriptions") {
                el.style.display = "none";
            }
        });
    });
}

function stopAllVideos() {
    document.querySelectorAll("video").forEach(video => {
        video.pause();
        video.removeAttribute("src");
        video.load();
    });
}

function enforceYouTubeRestrictions() {
    if (!isLocked) return;

    blockShortsPage();
    removeShortsElements();
    removeHomePageElements();

    if (window.location.pathname === "/" || isShortsPage()) {
        stopAllVideos();
    }
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

checkLockStatus((locked) => {
    if (locked) {
        enforceYouTubeRestrictions();
        startObserver();
    }
});

let lastUrl = location.href;
setInterval(() => {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        checkLockStatus((locked) => {
            if (locked) {
                enforceYouTubeRestrictions();
            }
        });
    }
}, 500);

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && (changes.lockEndDate || changes.overrideUntil)) {
        checkLockStatus((locked) => {
            if (locked) {
                enforceYouTubeRestrictions();
                if (!observerStarted) {
                    startObserver();
                }
            }
        });
    }
});
