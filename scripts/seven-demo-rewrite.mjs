const introBlock = `function dismissIntro() {
  if (!document.querySelector(".seven-intro")) return;
  clearTimeout(state.introTimer);
  clearTimeout(state.introSafetyTimer);
  state.introTimer = null;
  state.introSafetyTimer = null;
  document.documentElement.style.overflow = "";
  document.querySelector(".seven-intro")?.remove();
}
function maybeFinishIntro() {
  if (!state.startupReady || !state.introAnimationComplete || state.introExitStarted) return;
  const overlay = document.querySelector(".seven-intro");
  if (!overlay) return;
  state.introExitStarted = true;
  overlay.classList.add("exiting");
  clearTimeout(state.introSafetyTimer);
  state.introTimer = setTimeout(dismissIntro, 450);
}
function renderLaunchIntro() {
  if (prefersReducedMotion() || !launchIntroEnabled()) {
    state.introAnimationComplete = true;
    return;
  }
  if (document.querySelector(".seven-intro")) return;
  const overlay = document.createElement("div");
  overlay.className = "seven-intro";
  overlay.addEventListener("animationend", event => {
    if (event.target?.classList?.contains("seven-intro-logo-wrap") && event.animationName === "intro-life") {
      state.introAnimationComplete = true;
      maybeFinishIntro();
    }
  });
  document.documentElement.style.overflow = "hidden";
  document.body.appendChild(overlay);
  const logo = new Image();
  logo.src = "/assets/seven-wordmark-v2.png";
  const fill = () => {
    if (!overlay.isConnected) return;
    const mark = logo.complete && logo.naturalWidth
      ? '<img class="seven-intro-logo" src="' + logo.src + '" alt="">'
      : '<span class="seven-intro-wordmark">SEVEN</span>';
    overlay.innerHTML = '<div class="seven-intro-glow" aria-hidden="true"></div><div class="seven-intro-streak" aria-hidden="true"></div><div class="seven-intro-logo-wrap" aria-hidden="true">' + mark + '</div>';
  };
  state.introSafetyTimer = setTimeout(() => {
    state.startupReady = true;
    state.introAnimationComplete = true;
    maybeFinishIntro();
  }, 12000);
  const imageReady = typeof logo.decode === "function"
    ? logo.decode().then(() => true, () => false)
    : new Promise(resolve => { logo.onload = () => resolve(true); logo.onerror = () => resolve(false); });
  Promise.race([imageReady, new Promise(resolve => setTimeout(() => resolve(false), 1800))]).then(fill);
}`;

function rewriteApp(content) {
  let rewritten = content.replace(/(async function openItem\(type, id\) \{\r?\n)\s*scrollToTop\(\);\r?\n/, "$1");

  const introStart = rewritten.indexOf("function dismissIntro() {");
  const startupMarker = "function screenTimeState(";
  const introEnd = rewritten.indexOf(startupMarker, introStart);
  if (introStart !== -1 && introEnd !== -1) {
    rewritten = rewritten.slice(0, introStart) + introBlock + "\n" + rewritten.slice(introEnd);
  }

  rewritten = rewritten.replace(
    /renderLaunchIntro\(\);\r?\nboot\(\);/,
    `renderLaunchIntro();
const markStartupReady = () => { state.startupReady = true; maybeFinishIntro(); };
void boot().then(markStartupReady, error => {
  state.error = error?.message || "Startup failed";
  if (!app.childElementCount) renderOfflineScreen();
  markStartupReady();
});`,
  );
  return rewritten;
}

function rewriteStyles(content) {
  return content
    .replace(
      /\.seven-intro \{ position: fixed; z-index: 400; inset: 0; display: grid; place-items: center; overflow: hidden; background: #000; cursor: pointer; \}\r?\n\.seven-intro\.live \{ animation: intro-out \.25s ease 2\.75s forwards; \}/,
      ".seven-intro { position: fixed; z-index: 400; inset: 0; display: grid; place-items: center; overflow: hidden; background: #000; cursor: default; transition: opacity .42s ease; }\n.seven-intro.exiting { opacity: 0; pointer-events: none; }",
    )
    .replace(/@keyframes intro-out \{ to \{ opacity: 0; \} \}\r?\n/, "")
    .replace(
      ".seven-intro-logo { display: block; width: 100%; height: auto; }",
      ".seven-intro-logo { display: block; width: 100%; height: auto; }\n.seven-intro-wordmark { color: #ed0712; font: 900 clamp(58px, 16vw, 148px)/.8 Arial, sans-serif; letter-spacing: -.09em; }",
    )
    .replace(
      /89% \{ opacity: 1; transform: scale\(1\); filter: brightness\(1\) saturate\(1\); \}\r?\n  100% \{ opacity: 0; \}/,
      "89% { opacity: 1; transform: scale(1); filter: brightness(1) saturate(1); }\n  100% { opacity: 1; transform: scale(1); filter: brightness(1) saturate(1); }",
    );
}

export function rewriteSevenDemoAsset(filePath, content) {
  if (filePath.endsWith("index.html")) return content.replaceAll('="/', '="./').replaceAll("='/", "='./").replaceAll("?v=84", "?v=85");
  if (filePath.endsWith(".css")) return rewriteStyles(content.replaceAll("url('/", "url('./").replaceAll('url("/', 'url("./'));
  if (filePath.endsWith("app.js")) {
    return rewriteApp(content
      .replaceAll('"/assets/', '"./assets/')
      .replaceAll('"/icon.svg"', '"./icon.svg"')
      .replaceAll('"/service-worker.js', '"./service-worker.js')
      .replaceAll('"/api/', '"./api/')
      .replaceAll('`/api/', '`./api/'))
      .replaceAll("service-worker.js?v=84", "service-worker.js?v=85");
  }
  if (filePath.endsWith(".webmanifest")) return content.replaceAll('"/', '"./');
  return content;
}
