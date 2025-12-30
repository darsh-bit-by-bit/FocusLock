const app = document.getElementById("app");
const NOW = () => Date.now();
const FIFTEEN_MIN = 15 * 60 * 1000;

chrome.storage.local.get(
    ["lockEndDate", "overrideUntil", "overrideCount"],
    (data) => {
        const lockEnd = data.lockEndDate;
        const overrideUntil = data.overrideUntil;
        const overrideCount = data.overrideCount || 0;

        const lockActive =
            lockEnd && NOW() < lockEnd &&
            (!overrideUntil || NOW() > overrideUntil);

        if (!lockEnd || NOW() > lockEnd) {
            app.innerHTML = `
        <p><strong>Ignoring distraction keeps you average.</strong></p>
        <p>
          Installing this extension means you chose to act.<br>
          If you want to go further, close this tab, take a breath,
          and do the work you already know you should be doing.
        </p>

        <input type="date" id="date" />
        <button id="lockBtn">Lock Until This Date</button>
      `;

            document.getElementById("lockBtn").onclick = () => {
                const dateInput = document.getElementById("date").value;
                if (!dateInput) return;

                const end = new Date(dateInput + "T23:59:59").getTime();


                chrome.storage.local.set({
                    lockEndDate: end,
                    overrideUntil: null,
                    overrideCount: 0
                }, () => window.close());
            };

            return;
        }

        const daysLeft = Math.ceil((lockEnd - NOW()) / (1000 * 60 * 60 * 24));

        app.innerHTML = `
      <p><strong>🔒 Locked</strong></p>
      <p>Until: ${new Date(lockEnd).toDateString()}</p>
      <p>Days remaining: ${daysLeft}</p>
      <p>Overrides used: ${overrideCount} / 2</p>

      <textarea id="reason" placeholder="Reason for override (required)"></textarea>
      <button id="overrideBtn">Emergency Override (15 min)</button>

      <p class="small">No normal way to disable this.</p>
    `;

        document.getElementById("overrideBtn").onclick = () => {
            const reason = document.getElementById("reason").value.trim();
            if (!reason) return;
            if (overrideCount >= 2) return;

            chrome.storage.local.set({
                overrideUntil: NOW() + FIFTEEN_MIN,
                overrideCount: overrideCount + 1
            }, () => window.close());
        };
    }
);
