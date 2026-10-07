import { InferenceClient } from "https://cdn.jsdelivr.net/npm/@huggingface/inference@3.15.0/+esm";

const themeToggle = document.querySelector(".theme-toggle");
const promptForm = document.querySelector(".prompt-form");
const promptInput = document.querySelector(".prompt-input");
const promptBtn = document.querySelector(".prompt-btn");
const modelSelect = document.querySelector("#model-select");
const countSelect = document.querySelector("#count-select");
const ratioSelect = document.querySelector("#ratio-select");
const gridGallery = document.querySelector(".gallery-grid");

const API_KEY = "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";

const examplePrompts = [
  "A magic forest with glowing plants and fairy homes among giant mushrooms",
  "An old steampunk airship floating through golden clouds at sunset",
  "A future Mars colony with glass domes and gardens against red mountains",
  "A dragon sleeping on gold coins in a crystal cave",
  "An underwater kingdom with merpeople and glowing coral buildings",
  "A floating island with waterfalls pouring into clouds below",
  "A witch's cottage in fall with magic herbs in the garden",
  "A robot painting in a sunny studio with art supplies around it",
  "A magical library with floating glowing books and spiral staircases",
  "A Japanese shrine during cherry blossom season with lanterns and misty mountains",
  "A cosmic beach with glowing sand and an aurora in the night sky",
  "A medieval marketplace with colorful tents and street performers",
  "A cyberpunk city with neon signs and flying cars at night",
  "A peaceful bamboo forest with a hidden ancient temple",
  "A giant turtle carrying a village on its back in the ocean",
];

// set theme based on saved perference or system default:
(() => {
  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia(
    "(prefers-color-scheme : dark)",
  ).matches;

  const isDarkTheme =
    savedTheme === "Dark" || (!savedTheme && systemPrefersDark);
  document.body.classList.toggle("dark-theme", isDarkTheme);
  themeToggle.querySelector("i").className = isDarkTheme
    ? "fa-solid fa-sun"
    : "fa-solid fa-moon";
})();

// theme toggle:
const toggleTheme = () => {
  const isDarkTheme = document.body.classList.toggle("dark-theme");
  localStorage.setItem("theme", isDarkTheme ? "Dark" : "Light");
  themeToggle.querySelector("i").className = isDarkTheme
    ? "fa-solid fa-sun"
    : "fa-solid fa-moon";
};

const getImageDimensions = (aspectRatio, baseSize = 512) => {
  const [width, height] = aspectRatio.split("/").map(Number);
  const scaleFactor = baseSize / Math.sqrt(width * height);

  let calculatedWidth = Math.round(width * scaleFactor);
  let calculatedheight = Math.round(height * scaleFactor);

  calculatedWidth = Math.floor(calculatedWidth / 16) * 16;
  calculatedheight = Math.floor(calculatedheight / 16) * 16;

  return { width: calculatedWidth, height: calculatedheight };
};

const updateImageCard = (imgIndex, imgUrl) => {
  const imgCard = document.getElementById(`img-card-${imgIndex}`);
  if (!imgCard) return;

  imgCard.classList.remove("loading");
  imgCard.innerHTML = `<img src="${imgUrl}" alt="" class="result-img" />
    <div class="img-overlay"}>
        <a href="${imgUrl}" class="img-download-btn" download="${Date.now()}.png">
            <i class="fa-solid fa-download"></i>
        </a>
    </div>`;
};

// Creates placeholder cards with a loading spinner while the real
// images are being fetched by generateImages().
const createImageCards = (imageCount, aspectRatio) => {
  gridGallery.innerHTML = "";
 
  // normalize aspect ratio for inline style (ensure format "W / H")
  const ratioStyle = aspectRatio.includes("/")
    ? aspectRatio
        .split("/")
        .map((s) => s.trim())
        .join(" / ")
    : aspectRatio;
 
  for (let i = 0; i < imageCount; i++) {
    gridGallery.innerHTML += `
      <div class="img-card loading" id="img-card-${i}" style="aspect-ratio: ${ratioStyle}">
        <div class="status-container">
          <div class="spinner"></div>
          <i class="fa-solid fa-triangle-exclamation"></i>
          <p class="status-text">Generating...</p>
        </div>
        <img src="" alt="" class="result-img" id="result-img-${i}" />
      </div>`;
  }
};


const generateImages = async (
  selectedModel,
  imageCount,
  aspectRatio,
  promptText,
) => {
  const { width, height } = getImageDimensions(aspectRatio);
  const client = new InferenceClient(API_KEY);
 
  const imagePromises = Array.from({ length: imageCount }, async (_, i) => {
    try {
      const imageBlob = await client.textToImage({
        model: selectedModel,
        inputs: promptText,
        provider: "auto",
        parameters: { width, height },
      });
 
      updateImageCard(i, URL.createObjectURL(imageBlob));
    } catch (error) {
      console.log(`Image ${i} failed:`, error);
 
      // Show the failure on the card itself instead of leaving
      // a spinner running forever with no explanation.
      const cardEl = document.getElementById(`img-card-${i}`);
      if (cardEl) {
        cardEl.classList.remove("loading");
        cardEl.classList.add("error");
        const st = cardEl.querySelector(".status-text");
        if (st) st.textContent = "Failed to generate image";
      }
    }
  });
 
  await Promise.allSettled(imagePromises);
};

// handle form submittion:
const handleFormSubmit = (e) => {
  e.preventDefault();
  const selectedModel = modelSelect.value;
  const imageCount = parseInt(countSelect.value) || 1;
  const aspectRatio = ratioSelect.value || "1/1";
  const promptText = promptInput.value.trim();

  createImageCards(imageCount, aspectRatio);
  generateImages(selectedModel, imageCount, aspectRatio, promptText);
};

// fills prompt-input with a random example prompt
promptBtn.addEventListener("click", () => {
  const prompt =
    examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
  promptInput.value = prompt;
  promptInput.focus();
});

promptForm.addEventListener("submit", handleFormSubmit);
themeToggle.addEventListener("click", toggleTheme);
