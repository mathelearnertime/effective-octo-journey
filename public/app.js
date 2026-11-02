const form = document.getElementById("searchForm");
const address = document.getElementById("address");
const browser = document.getElementById("browser");
const viewer = document.getElementById("viewer");
const currentUrl = document.getElementById("currentUrl");
const blocked = document.getElementById("blocked");
let current = "";
let historyList = [];
let historyIndex = -1;

function normalizeInput(value) {
 const text = value.trim();
 if (!text) return "";
 if (/^(https?:\/\/)/i.test(text)) return text;
 if (/^[\w.-]+\.[a-z]{2,}([/:?#]|$)/i.test(text)) return "https://" + text;
 return "https://duckduckgo.com/?q=" + encodeURIComponent(text);
}

function navigate(value, addHistory = true) {
 const url = normalizeInput(value);
 if (!url) return;
 
 // Use our local proxy!
 const proxyUrl = `/proxy/${encodeURIComponent(url)}`;
 
 current = url; // Keep track of the *real* URL for display/history
 browser.hidden = false;
 document.getElementById("home").style.display = "none";
 currentUrl.textContent = url;
 address.value = url;
 blocked.hidden = true;
 
 // Load via proxy
 viewer.src = proxyUrl;
 
 if (addHistory) {
     historyList = historyList.slice(0, historyIndex + 1);
     historyList.push(url);
     historyIndex = historyList.length - 1;
 }
 document.getElementById("status").textContent = "Viewing website";
}

form.addEventListener("submit", event => { event.preventDefault(); navigate(address.value); });

document.querySelectorAll("[data-url]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.url)));

document.getElementById("back").addEventListener("click", () => {
 if (historyIndex > 0) { historyIndex--; navigate(historyList[historyIndex], false); }
});

document.getElementById("forward").addEventListener("click", () => {
 if (historyIndex < historyList.length - 1) { historyIndex++; navigate(historyList[historyIndex], false); }
});

document.getElementById("refresh").addEventListener("click", () => { if (current) viewer.src = `/proxy/${encodeURIComponent(current)}`; });

document.getElementById("homeBtn").addEventListener("click", () => {
 viewer.src = "about:blank"; browser.hidden = true;
 document.getElementById("home").style.display = "";
 document.getElementById("status").textContent = "Local browser shell";
});

document.getElementById("newTab").addEventListener("click", () => {
 if (current) window.open(current, "_blank", "noopener");
});

document.getElementById("openExternal").addEventListener("click", () => {
 if (current) window.open(current, "_blank", "noopener");
});

viewer.addEventListener("load", () => { blocked.hidden = true; });