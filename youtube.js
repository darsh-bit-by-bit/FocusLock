// Day 4 MVP: YouTube Smart Mode
// Shorts and recommendations are disabled at the content level.
// Navigation elements may remain visible but are non-functional by design.

function isLockActive(callback) {
    chrome.storage.local.get(
        ["lockEndDate", "overrideUntil"],
        (data) => {
            const now = Date.now();
            const lockEnd = data.lockEndDate;
            const overrideUntil = data.overrideUntil;

            const active =
                lockEnd &&
                now < lockEnd &&
                (!overrideUntil || now > overrideUntil);

            callback(active);
        }
    );
}

function cleanHomePage() {
    document
        .querySelectorAll("ytd-rich-item-renderer, ytd-rich-grid-row")
        .forEach(el => el.remove());
}

function cleanWatchPage() {
    const related = document.getElementById("related");
    if (related) related.remove();

    const comments = document.getElementById("comments");
    if (comments) comments.remove();
}

function disableShortsNavigation() {
    document
        .querySelectorAll('a[href^="/shorts"]')
        .forEach(el => el.remove());

    if (location.pathname.startsWith("/shorts")) {
        document.body.innerHTML = "";
    }
}

function enforceMediaPolicy() {
    const isWatchPage = location.pathname.startsWith("/watch");

    document.querySelectorAll("video, audio").forEach(media => {
        if (!isWatchPage) {
            media.pause();
            media.muted = true;
            media.autoplay = false;
        }
    });
}


function applyRules() {
    const path = location.pathname;

    if (path === "/") {
        cleanHomePage();
    }

    if (path.startsWith("/watch")) {
        cleanWatchPage();
    }

    disableShortsNavigation();

    enforceMediaPolicy();
}

isLockActive((active) => {
    if (!active) return;

    applyRules();

    const observer = new MutationObserver(() => {
        applyRules();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});
