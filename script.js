// ---------- storage ----------
const STORAGE_KEY = "atlp-books";
const ROW_SIZE = 4; // books per shelf row

function loadBooks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Could not read saved books:", e);
    return [];
  }
}

function saveBooks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  } catch (e) {
    console.error("Could not save books:", e);
    alert("Your shelf couldn't be saved (storage might be full). Try backing up and removing an old cover photo.");
  }
}

let books = loadBooks();
let activeId = null;

// ---------- rating config ----------
const ICON_RATINGS = [
  { key: "overall", label: "Overall", icon: "⭐" },
  { key: "spice", label: "Spice", icon: "🌶️" },
  { key: "chemistry", label: "Chemistry", icon: "💕" },
  { key: "cry", label: "Cry meter", icon: "😭" },
];
const ENDING_OPTIONS = ["", "Happy", "Bittersweet", "Heartbreak", "Cliffhanger"];

// ---------- elements ----------
const shelfView = document.getElementById("shelf-view");
const reviewView = document.getElementById("review-view");
const shelvesEl = document.getElementById("shelves");
const counterEl = document.getElementById("counter");

const backBtn = document.getElementById("back-btn");
const deleteBtn = document.getElementById("delete-btn");
const exportBtn = document.getElementById("export-btn");
const importFile = document.getElementById("import-file");

const coverBox = document.querySelector(".cover-box");
const coverFile = document.getElementById("cover-file");
const coverImg = document.getElementById("cover-img");
const coverHint = document.getElementById("cover-hint");

const fTitle = document.getElementById("f-title");
const fAuthor = document.getElementById("f-author");
const fGenre = document.getElementById("f-genre");
const fFormat = document.getElementById("f-format");
const fPages = document.getElementById("f-pages");
const fThoughts = document.getElementById("f-thoughts");
const fCharacters = document.getElementById("f-characters");
const fMoments = document.getElementById("f-moments");
const fThemes = document.getElementById("f-themes");
const ratingsEl = document.getElementById("ratings");

// ---------- small decorations for empty slots ----------
const decorSvgs = [
  `<svg viewBox="0 0 60 90"><rect x="14" y="55" width="32" height="26" rx="4" fill="#f0a4c0"/><path d="M30 55 C 15 40, 15 20, 30 10 C 45 20, 45 40, 30 55 Z" fill="#7fae7f"/></svg>`,
  `<svg viewBox="0 0 60 90"><ellipse cx="30" cy="70" rx="14" ry="16" fill="#f6c453"/><path d="M30 54 C 20 40, 40 40, 30 25" stroke="#e0669b" stroke-width="3" fill="none"/><circle cx="30" cy="22" r="6" fill="#e0669b"/></svg>`,
];

// ---------- rendering the shelf ----------
function renderShelf() {
  shelvesEl.innerHTML = "";
  counterEl.textContent = `${books.length} book${books.length === 1 ? "" : "s"}`;

  const items = [...books.map((b) => ({ type: "book", book: b })), { type: "add" }];
  const rows = [];
  for (let i = 0; i < items.length; i += ROW_SIZE) {
    rows.push(items.slice(i, i + ROW_SIZE));
  }

  rows.forEach((row) => {
    const shelf = document.createElement("div");
    shelf.className = "shelf";

    const rowEl = document.createElement("div");
    rowEl.className = "shelf-row";
    rowEl.style.setProperty("--cols", ROW_SIZE);

    while (row.length < ROW_SIZE) row.push({ type: "decor" });

    row.forEach((item) => {
      if (item.type === "book") {
        rowEl.appendChild(renderBookSlot(item.book));
      } else if (item.type === "add") {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "slot add";
        btn.setAttribute("aria-label", "Add a new book");
        btn.textContent = "+";
        btn.addEventListener("click", addBook);
        rowEl.appendChild(btn);
      } else {
        const d = document.createElement("div");
        d.className = "slot decor";
        d.innerHTML = decorSvgs[Math.floor(Math.random() * decorSvgs.length)];
        rowEl.appendChild(d);
      }
    });

    const board = document.createElement("div");
    board.className = "board";

    shelf.appendChild(rowEl);
    shelf.appendChild(board);
    shelvesEl.appendChild(shelf);
  });
}

function renderBookSlot(book) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "slot book";
  btn.setAttribute("aria-label", `Open ${book.title || "untitled book"}`);

  if (book.cover) {
    const img = document.createElement("img");
    img.src = book.cover;
    img.alt = book.title || "Book cover";
    btn.appendChild(img);
  } else {
    const fake = document.createElement("div");
    fake.className = "fake-cover";
    fake.textContent = book.title ? book.title : "Untitled";
    btn.appendChild(fake);
  }

  btn.addEventListener("click", () => openReview(book.id));
  return btn;
}

// ---------- add / open / delete ----------
function addBook() {
  const book = {
    id: "b" + Date.now() + Math.random().toString(16).slice(2),
    title: "",
    author: "",
    genre: "",
    format: "Paperback",
    pages: "",
    cover: null,
    ratings: { overall: 0, spice: 0, chemistry: 0, cry: 0, ending: "" },
    thoughts: "",
    characters: "",
    moments: "",
    themes: "",
  };
  books.push(book);
  saveBooks();
  openReview(book.id);
}

function openReview(id) {
  activeId = id;
  const book = books.find((b) => b.id === id);
  if (!book) return;

  fTitle.value = book.title || "";
  fAuthor.value = book.author || "";
  fGenre.value = book.genre || "";
  fFormat.value = book.format || "Paperback";
  fPages.value = book.pages || "";
  fThoughts.value = book.thoughts || "";
  fCharacters.value = book.characters || "";
  fMoments.value = book.moments || "";
  fThemes.value = book.themes || "";

  if (book.cover) {
    coverImg.src = book.cover;
    coverImg.hidden = false;
    coverHint.hidden = true;
  } else {
    coverImg.hidden = true;
    coverHint.hidden = false;
  }

  renderRatings(book);

  shelfView.hidden = true;
  reviewView.hidden = false;
  window.scrollTo(0, 0);
}

function closeReview() {
  activeId = null;
  shelfView.hidden = false;
  reviewView.hidden = true;
  renderShelf();
}

function deleteActiveBook() {
  if (!activeId) return;
  if (!confirm("Delete this book from your shelf? This can't be undone.")) return;
  books = books.filter((b) => b.id !== activeId);
  saveBooks();
  closeReview();
}

// ---------- ratings UI ----------
function renderRatings(book) {
  ratingsEl.innerHTML = "";

  ICON_RATINGS.forEach(({ key, label, icon }) => {
    const row = document.createElement("div");
    row.className = "rate-row";

    const span = document.createElement("span");
    span.textContent = label;

    const iconsWrap = document.createElement("div");
    iconsWrap.className = "rate-icons";

    for (let i = 1; i <= 5; i++) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = icon;
      b.className = (book.ratings[key] || 0) >= i ? "on" : "";
      b.setAttribute("aria-label", `${label}: ${i} of 5`);
      b.addEventListener("click", () => {
        book.ratings[key] = book.ratings[key] === i ? 0 : i;
        saveBooks();
        renderRatings(book);
      });
      iconsWrap.appendChild(b);
    }

    row.appendChild(span);
    row.appendChild(iconsWrap);
    ratingsEl.appendChild(row);
  });

  const endRow = document.createElement("div");
  endRow.className = "rate-row";
  const endLabel = document.createElement("span");
  endLabel.textContent = "Ending";
  const endSelect = document.createElement("select");
  ENDING_OPTIONS.forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt;
    o.textContent = opt || "Not set";
    if (book.ratings.ending === opt) o.selected = true;
    endSelect.appendChild(o);
  });
  endSelect.addEventListener("change", () => {
    book.ratings.ending = endSelect.value;
    saveBooks();
  });
  endRow.appendChild(endLabel);
  endRow.appendChild(endSelect);
  ratingsEl.appendChild(endRow);
}

// ---------- cover upload with compression ----------
function handleCoverFile(file) {
  if (!file || !activeId) return;
  const book = books.find((b) => b.id === activeId);
  if (!book) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const maxW = 500;
      const scale = Math.min(1, maxW / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.82);

      book.cover = dataUrl;
      saveBooks();
      coverImg.src = dataUrl;
      coverImg.hidden = false;
      coverHint.hidden = true;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ---------- text field autosave ----------
function bindField(input, key) {
  input.addEventListener("input", () => {
    const book = books.find((b) => b.id === activeId);
    if (!book) return;
    book[key] = input.value;
    saveBooks();
  });
}

bindField(fTitle, "title");
bindField(fAuthor, "author");
bindField(fGenre, "genre");
bindField(fFormat, "format");
bindField(fPages, "pages");
bindField(fThoughts, "thoughts");
bindField(fCharacters, "characters");
bindField(fMoments, "moments");
bindField(fThemes, "themes");

// ---------- events ----------
backBtn.addEventListener("click", closeReview);
deleteBtn.addEventListener("click", deleteActiveBook);
coverBox.addEventListener("click", () => coverFile.click());
coverFile.addEventListener("change", (e) => handleCoverFile(e.target.files[0]));

exportBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(books, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "after-the-last-page-backup.json";
  a.click();
  URL.revokeObjectURL(url);
});

importFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const parsed = JSON.parse(ev.target.result);
      if (!Array.isArray(parsed)) throw new Error("Not a valid backup file");
      if (!confirm(`Restore ${parsed.length} book(s)? This will replace your current shelf.`)) return;
      books = parsed;
      saveBooks();
      renderShelf();
    } catch (err) {
      alert("That file couldn't be read as a backup. Make sure it's the JSON file this app exported.");
    }
  };
  reader.readAsText(file);
  importFile.value = "";
});

// ---------- go ----------
renderShelf();