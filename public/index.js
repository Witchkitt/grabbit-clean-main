document.addEventListener("DOMContentLoaded", () => {
  const app = document.getElementById("app");

  app.innerHTML = `
    <h1>Grabbit App</h1>
    <button id="listenToggle">🔊 Always Listening: OFF</button>
    <ul id="reminderList"></ul>
  `;

  let listening = false;
  const toggle = document.getElementById("listenToggle");
  const list = document.getElementById("reminderList");

  toggle.onclick = () => {
    listening = !listening;
    toggle.textContent = \`🔊 Always Listening: \${listening ? "ON" : "OFF"}\`;
    if (listening) {
      alert("Hey Grabbit is now listening...");
      list.innerHTML += `<li>Example Reminder: Buy Toothpaste at Safeway</li>`;
    }
  };
});
