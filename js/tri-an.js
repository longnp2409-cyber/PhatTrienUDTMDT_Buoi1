document.documentElement.classList.add("js");

const openLetter = document.querySelector("#openLetter");
const letterCard = document.querySelector("#letterCard");
const musicToggle = document.querySelector("#musicToggle");
const audioStatus = document.querySelector("#audioStatus");
const thankYouAudio = document.querySelector("#thankYouAudio");
const thankButton = document.querySelector("#thankButton");
const thankMessage = document.querySelector("#thankMessage");
const sparkleLayer = document.querySelector("#sparkleLayer");
let audioState = "off";
let playPending = false;
let audioRequest = 0;
const maxSparkles = 20;

function setStatus(message) {
  audioStatus.textContent = message;
}

function updateMusicButton(isPlaying) {
  audioState = isPlaying ? "playing" : "off";
  musicToggle.textContent = isPlaying ? "Tắt nhạc" : "Bật nhạc";
  musicToggle.setAttribute("aria-pressed", String(isPlaying));
  musicToggle.classList.toggle("is-playing", isPlaying);
}

function startMusic() {
  if (audioState === "playing" || playPending) return;
  const requestId = ++audioRequest;
  playPending = true;
  // play() được gọi ngay trong sự kiện bấm, không qua timer hay thao tác chờ.
  const playPromise = thankYouAudio.play();
  if (!playPromise) return;
  playPromise.then(() => {
    playPending = false;
    if (requestId !== audioRequest) return;
    updateMusicButton(true);
    setStatus("Đang phát nhạc · Bấm Tắt nhạc để tạm dừng");
  }).catch(() => {
    if (requestId !== audioRequest) return;
    playPending = false;
    updateMusicButton(false);
    setStatus("Không thể phát nhạc · Bạn vẫn có thể đọc lời tri ân");
  });
}

function stopMusic() {
  audioRequest += 1;
  playPending = false;
  thankYouAudio.pause();
  updateMusicButton(false);
  setStatus("Nhạc đang tạm dừng · Bấm Bật nhạc để tiếp tục");
}

function createSparkles() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  for (let i = 0; i < 12 && sparkleLayer.children.length < maxSparkles; i += 1) {
    const sparkle = document.createElement("span");
    sparkle.className = "sparkle";
    sparkle.style.left = `${35 + Math.random() * 30}%`;
    sparkle.style.top = `${28 + Math.random() * 35}%`;
    sparkle.style.setProperty("--x", `${(Math.random() - .5) * 180}px`);
    sparkle.style.setProperty("--y", `${(Math.random() - .5) * 140}px`);
    sparkleLayer.appendChild(sparkle);
    window.setTimeout(() => sparkle.remove(), 900);
  }
}

function revealLetter() {
  letterCard.classList.remove("is-closed");
  letterCard.classList.add("is-open");
  letterCard.setAttribute("aria-hidden", "false");
  openLetter.setAttribute("aria-expanded", "true");
  openLetter.innerHTML = 'Lời tri ân đã mở <span aria-hidden="true">→</span>';
  createSparkles();
}

openLetter.addEventListener("click", () => {
  startMusic();
  revealLetter();
  letterCard.scrollIntoView({ behavior: "smooth", block: "center" });
});

musicToggle.addEventListener("click", () => {
  if (audioState === "playing" || playPending) stopMusic();
  else startMusic();
});

thankYouAudio.addEventListener("ended", () => {
  thankYouAudio.currentTime = 0;
  updateMusicButton(false);
  setStatus("Bản nhạc đã kết thúc · Bấm Bật nhạc để nghe lại");
});

thankYouAudio.addEventListener("error", () => {
  if (!playPending && audioState !== "playing") return;
  playPending = false;
  updateMusicButton(false);
  setStatus("Không tìm thấy hoặc không thể phát file tri-an-thay-co.mp3");
});

thankButton.addEventListener("click", () => {
  thankMessage.hidden = false;
  thankMessage.classList.remove("thank-message--show");
  void thankMessage.offsetWidth;
  thankMessage.classList.add("thank-message--show");
  createSparkles();
});

const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: .15 });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

// Chỉ JS mới thu gọn thư; nếu JS lỗi, nội dung thư vẫn hiển thị nhờ HTML/CSS mặc định.
letterCard.classList.add("is-closed");
letterCard.setAttribute("aria-hidden", "true");
