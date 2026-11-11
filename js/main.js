const MUSIC_URL = "./assets/audio/tri-an-thay-co.mp3";

const bubbleField = document.querySelector("#bubbleField");
const musicToggle = document.querySelector("#musicToggle");
const audioStatus = document.querySelector("#audioStatus");
const sparkleLayer = document.querySelector("#sparkleLayer");
const maxSparkles = 18;
const maxGreetings = 3;
const desktopBubbleLimit = 14;
const phoneBubbleLimit = 8;

let bubbleTimer = null;
let isPageVisible = document.visibilityState === "visible";
let audioElement = null;
let musicState = "off";
let musicRequest = 0;
let playPending = false;

function setStatus(message) {
  audioStatus.textContent = message;
}

function getBubbleLimit() {
  return window.matchMedia("(max-width: 760px)").matches ? phoneBubbleLimit : desktopBubbleLimit;
}

function createSparkles(rect) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const existing = sparkleLayer.querySelectorAll(".sparkle");
  existing.forEach((item, index) => {
    if (index >= maxSparkles - 8) item.remove();
  });

  for (let i = 0; i < 8 && sparkleLayer.children.length < maxSparkles; i += 1) {
    const sparkle = document.createElement("span");
    sparkle.className = "sparkle";
    sparkle.style.left = `${centerX}px`;
    sparkle.style.top = `${centerY}px`;
    sparkle.style.setProperty("--x", `${Math.cos((i / 8) * Math.PI * 2) * (35 + Math.random() * 35)}px`);
    sparkle.style.setProperty("--y", `${Math.sin((i / 8) * Math.PI * 2) * (35 + Math.random() * 35)}px`);
    sparkleLayer.appendChild(sparkle);
    window.setTimeout(() => sparkle.remove(), 900);
  }
}

function showBubbleGreeting(rect) {
  const greetings = document.querySelectorAll(".bubble-greeting");
  if (greetings.length >= maxGreetings) greetings[0].remove();

  const greeting = document.createElement("div");
  const viewportPadding = 12;
  const maxWidth = Math.min(280, Math.max(0, window.innerWidth - viewportPadding * 2));
  const halfWidth = maxWidth / 2;
  const bubbleCenter = rect.left + rect.width / 2;
  const left = Math.min(
    Math.max(bubbleCenter, viewportPadding + halfWidth),
    window.innerWidth - viewportPadding - halfWidth,
  );
  const top = Math.min(
    Math.max(rect.top + rect.height / 2 - 12, viewportPadding),
    Math.max(viewportPadding, window.innerHeight - 64),
  );

  greeting.className = "bubble-greeting";
  greeting.setAttribute("role", "status");
  greeting.textContent = "Chào mừng ngày nhà giáo Việt Nam 20/11";
  greeting.style.left = `${left}px`;
  greeting.style.top = `${top}px`;
  greeting.style.maxWidth = `${maxWidth}px`;
  document.body.appendChild(greeting);

  window.setTimeout(() => greeting.remove(), 2500);
}

function removeBubble(bubble) {
  if (bubble.isConnected) bubble.remove();
}

function createBubble() {
  if (!isPageVisible || bubbleField.children.length >= getBubbleLimit()) return;
  const size = 48 + Math.random() * 42;
  const maxLeft = Math.max(0, window.innerWidth - size);
  const bubble = document.createElement("button");
  bubble.type = "button";
  bubble.className = "floating-bubble";
  bubble.setAttribute("aria-label", "Làm vỡ bong bóng");
  bubble.style.setProperty("--size", `${size}px`);
  bubble.style.setProperty("--sway", `${Math.round((Math.random() * 2 - 1) * Math.min(90, window.innerWidth * 0.12))}px`);
  bubble.style.setProperty("--fall-duration", `${10 + Math.random() * 6}s`);
  bubble.style.left = `${Math.random() * maxLeft}px`;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    bubble.style.top = `${Math.random() * Math.max(0, window.innerHeight - size)}px`;
  }

  bubble.addEventListener("animationend", () => removeBubble(bubble), { once: true });
  bubble.addEventListener("click", handleBubblePress);
  bubbleField.appendChild(bubble);
}

function scheduleBubble() {
  if (!isPageVisible || bubbleTimer !== null) return;
  const delay = 700 + Math.random() * 500;
  bubbleTimer = window.setTimeout(() => {
    bubbleTimer = null;
    createBubble();
    scheduleBubble();
  }, delay);
}

function trimBubbles() {
  const limit = getBubbleLimit();
  while (bubbleField.children.length > limit) bubbleField.firstElementChild.remove();
}

function stopBubbleCreation() {
  if (bubbleTimer !== null) {
    window.clearTimeout(bubbleTimer);
    bubbleTimer = null;
  }
  bubbleField.classList.add("is-paused");
}

function startBubbleCreation() {
  if (!isPageVisible) return;
  bubbleField.classList.remove("is-paused");
  trimBubbles();
  scheduleBubble();
}

function updateMusicButton(isPlaying) {
  musicState = isPlaying ? "playing" : "off";
  musicToggle.classList.toggle("is-playing", isPlaying);
  musicToggle.setAttribute("aria-pressed", String(isPlaying));
  musicToggle.textContent = isPlaying ? "Tắt nhạc" : "Bật nhạc";
}

function handleAudioEnded() {
  audioElement.currentTime = 0;
  playPending = false;
  updateMusicButton(false);
  setStatus("Bài hát đã kết thúc · Bấm Bật nhạc để phát lại từ đầu");
}

function handleAudioError() {
  if (!playPending && musicState !== "playing") return;
  playPending = false;
  updateMusicButton(false);
  setStatus("Không thể phát file nhạc · Hãy kiểm tra assets/audio/tri-an-thay-co.mp3");
}

function stopMusic() {
  musicRequest += 1;
  playPending = false;
  if (audioElement) audioElement.pause();
  updateMusicButton(false);
  setStatus("Nhạc đang tạm dừng · Bấm Bật nhạc hoặc bong bóng tiếp theo để tiếp tục");
}

function startMusic() {
  if (musicState === "playing" || playPending) return;
  const requestId = ++musicRequest;
  if (!audioElement) {
    audioElement = new Audio(MUSIC_URL);
    audioElement.preload = "metadata";
    audioElement.addEventListener("ended", handleAudioEnded);
    audioElement.addEventListener("error", handleAudioError);
  }

  playPending = true;
  // play() được gọi trực tiếp trong chuỗi sự kiện bấm của người dùng.
  const playPromise = audioElement.play();
  if (!playPromise) return;
  playPromise.then(() => {
    playPending = false;
    if (requestId !== musicRequest) return;
    updateMusicButton(true);
    setStatus("Đang phát nhạc · Bấm Tắt nhạc để tạm dừng");
  }).catch(() => {
    if (requestId !== musicRequest) return;
    playPending = false;
    updateMusicButton(false);
    setStatus("Trình duyệt không thể phát file nhạc · Hãy thử lại");
  });
}

function handleBubblePress(event) {
  const bubble = event.currentTarget;
  if (bubble.classList.contains("is-popping")) return;
  const rect = bubble.getBoundingClientRect();
  // Phát trước hiệu ứng và timer; các bong bóng sau chỉ vỡ khi bộ phát đang chạy.
  if (musicState === "off" && !playPending) startMusic();
  bubble.classList.add("is-popping");
  createSparkles(rect);
  showBubbleGreeting(rect);
  window.setTimeout(() => removeBubble(bubble), 220);
}

musicToggle.addEventListener("click", () => {
  if (musicState === "playing" || playPending) stopMusic();
  else startMusic();
});

document.addEventListener("visibilitychange", () => {
  isPageVisible = document.visibilityState === "visible";
  if (isPageVisible) startBubbleCreation();
  else stopBubbleCreation();
});

window.addEventListener("resize", trimBubbles);

createBubble();
scheduleBubble();
