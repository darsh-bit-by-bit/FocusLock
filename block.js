chrome.storage.local.get(
    ["lockEndDate", "overrideUntil"],
    (data) => {
        const now = Date.now();
        const lockEnd = data.lockEndDate;
        const overrideUntil = data.overrideUntil;

        const lockActive =
            lockEnd && now < lockEnd &&
            (!overrideUntil || now > overrideUntil);

        if (!lockActive) return;


        window.stop();
        document.documentElement.innerHTML = `
        <html>
          <body style="
            background:#0f172a;
            color:#e5e7eb;
            display:flex;
            align-items:center;
            justify-content:center;
            height:100vh;
            font-family:system-ui;
            text-align:center;
          ">
            <div>
              <h1>🚫 Blocked by FocusLock</h1>
              <p>You made a commitment earlier.</p>
              <p>Close this tab and get back to work.</p>
            </div>
          </body>
        </html>
      `;
    }
);
