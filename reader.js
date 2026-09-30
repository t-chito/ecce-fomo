// 紙面の読み上げ。Web Speech API で見出しと本文を記事ごとに読む（出典・表は読まない）。
(() => {
  const synth = window.speechSynthesis;
  const meta = document.querySelector(".masthead__meta");
  if (!synth || !meta) return;

  const articles = [...document.querySelectorAll(".article")];
  if (articles.length === 0) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "reader-button";
  const stopButton = document.createElement("button");
  stopButton.type = "button";
  stopButton.className = "reader-button";
  stopButton.textContent = "■ 停止";
  meta.append(button, stopButton);

  let queue = [];
  let state = "idle"; // idle | playing | paused

  const render = () => {
    button.textContent = { idle: "▶ 読み上げ", playing: "❚❚ 一時停止", paused: "▶ 再開" }[state];
    stopButton.hidden = state === "idle";
  };

  const pickVoice = () =>
    synth.getVoices().find((v) => v.lang.replace("_", "-").startsWith("ja")) || null;

  // Chrome は長い発話を途中で切るため、段落単位に分けて順に読む
  const buildQueue = () =>
    articles.flatMap((article) => {
      const headline = article.querySelector(".article__headline");
      const paragraphs = [...article.querySelectorAll(".article__body > p, .article__body li")];
      return [headline, ...paragraphs]
        .filter(Boolean)
        .map((el) => ({ article, text: el.textContent.trim() }))
        .filter((item) => item.text);
    });

  const clearHighlight = () =>
    articles.forEach((a) => a.classList.remove("is-reading"));

  const speakNext = () => {
    const item = queue.shift();
    if (!item) {
      stop();
      return;
    }
    if (!item.article.classList.contains("is-reading")) {
      clearHighlight();
      item.article.classList.add("is-reading");
      item.article.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    const utterance = new SpeechSynthesisUtterance(item.text);
    utterance.lang = "ja-JP";
    utterance.voice = pickVoice();
    utterance.onend = () => {
      if (state === "playing") speakNext();
    };
    synth.speak(utterance);
  };

  const stop = () => {
    state = "idle";
    queue = [];
    synth.cancel();
    clearHighlight();
    render();
  };

  button.addEventListener("click", () => {
    if (state === "idle") {
      synth.cancel();
      queue = buildQueue();
      state = "playing";
      speakNext();
    } else if (state === "playing") {
      state = "paused";
      synth.pause();
    } else {
      state = "playing";
      synth.resume();
    }
    render();
  });

  stopButton.addEventListener("click", stop);
  window.addEventListener("pagehide", () => synth.cancel());
  render();
})();
