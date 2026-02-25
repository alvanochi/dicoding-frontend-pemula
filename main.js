
const STORAGE_KEY = 'BOOKSHELF_APPS';


function generateId() {
  return Number(new Date());
}

function isStorageExist() {
  return typeof Storage !== 'undefined';
}


function getBooks() {
  if (!isStorageExist()) return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveBooks(books) {
  if (!isStorageExist()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

function addBook(book) {
  const books = getBooks();
  books.push(book);
  saveBooks(books);
}

function deleteBook(id) {
  const books = getBooks();
  const updated = books.filter((b) => b.id !== id);
  saveBooks(updated);
}

function updateBook(updatedBook) {
  const books = getBooks();
  const index = books.findIndex((b) => b.id === updatedBook.id);
  if (index !== -1) {
    books[index] = updatedBook;
    saveBooks(books);
  }
}

function toggleBookComplete(id) {
  const books = getBooks();
  const book = books.find((b) => b.id === id);
  if (book) {
    book.isComplete = !book.isComplete;
    saveBooks(books);
  }
}


function createBookElement(book) {
  const div = document.createElement('div');
  div.setAttribute('data-bookid', book.id);
  div.setAttribute('data-testid', 'bookItem');

  const toggleLabel = book.isComplete ? 'Belum selesai dibaca' : 'Selesai dibaca';
  const toggleClass = book.isComplete ? 'btn-incomplete' : 'btn-complete';
  const toggleIcon = book.isComplete ? '' : '';

  div.innerHTML = `
    <h3 data-testid="bookItemTitle">${escapeHtml(book.title)}</h3>
    <p data-testid="bookItemAuthor">Penulis: ${escapeHtml(book.author)}</p>
    <p data-testid="bookItemYear">Tahun: ${book.year}</p>
    <div class="book-actions">
      <button data-testid="bookItemIsCompleteButton" class="${toggleClass}">
        ${toggleLabel}
      </button>
      <button data-testid="bookItemDeleteButton" class="btn-delete">
        Hapus Buku
      </button>
      <button data-testid="bookItemEditButton" class="btn-edit">
        Edit Buku
      </button>
    </div>
  `;

  div.querySelector('[data-testid="bookItemIsCompleteButton"]').addEventListener('click', () => {
    toggleBookComplete(book.id);
    renderBooks();
    showToast(
      book.isComplete
        ? 'Buku dipindahkan ke "Belum selesai dibaca"'
        : 'Buku dipindahkan ke "Selesai dibaca"',
      'success'
    );
  });

  div.querySelector('[data-testid="bookItemDeleteButton"]').addEventListener('click', () => {
    showConfirm(`Hapus buku "${book.title}"?`, () => {
      deleteBook(book.id);
      renderBooks();
      showToast('Buku berhasil dihapus', 'error');
    });
  });

  div.querySelector('[data-testid="bookItemEditButton"]').addEventListener('click', () => {
    openEditModal(book);
  });

  return div;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function renderBooks(filterTitle = '') {
  const books = getBooks();
  const incompleteList = document.getElementById('incompleteBookList');
  const completeList = document.getElementById('completeBookList');

  incompleteList.innerHTML = '';
  completeList.innerHTML = '';

  const query = filterTitle.toLowerCase().trim();
  const filtered = query ? books.filter((b) => b.title.toLowerCase().includes(query)) : books;

  const incomplete = filtered.filter((b) => !b.isComplete);
  const complete = filtered.filter((b) => b.isComplete);

  const incompleteBadge = document.getElementById('incompleteBadge');
  const completeBadge = document.getElementById('completeBadge');
  if (incompleteBadge) incompleteBadge.textContent = incomplete.length;
  if (completeBadge) completeBadge.textContent = complete.length;

  if (incomplete.length === 0) {
    incompleteList.innerHTML = `
      <div class="empty-state">
        <p>${query ? 'Tidak ada buku yang cocok' : 'Belum ada buku di rak ini'}</p>
      </div>
    `;
  } else {
    incomplete.forEach((book) => incompleteList.appendChild(createBookElement(book)));
  }

  if (complete.length === 0) {
    completeList.innerHTML = `
      <div class="empty-state">
        <p>${query ? 'Tidak ada buku yang cocok' : 'Belum ada buku di rak ini'}</p>
      </div>
    `;
  } else {
    complete.forEach((book) => completeList.appendChild(createBookElement(book)));
  }
}


function initAddForm() {
  const form = document.getElementById('bookForm');
  const isCompleteCheckbox = document.getElementById('bookFormIsComplete');
  const submitBtn = document.getElementById('bookFormSubmit');

  isCompleteCheckbox.addEventListener('change', () => {
    const span = submitBtn.querySelector('span');
    span.textContent = isCompleteCheckbox.checked ? 'Selesai dibaca' : 'Belum selesai dibaca';
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('bookFormTitle').value.trim();
    const author = document.getElementById('bookFormAuthor').value.trim();
    const year = Number(document.getElementById('bookFormYear').value);
    const isComplete = isCompleteCheckbox.checked;

    if (!title || !author || !year) {
      showToast('Harap isi semua field!', 'error');
      return;
    }

    const book = {
      id: generateId(),
      title,
      author,
      year,
      isComplete,
    };

    addBook(book);
    renderBooks();
    form.reset();

    submitBtn.querySelector('span').textContent = 'Belum selesai dibaca';

    showToast(`"${title}" berhasil ditambahkan!`, 'success');
  });
}


function initSearch() {
  const searchForm = document.getElementById('searchBook');
  const searchInput = document.getElementById('searchBookTitle');

  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    renderBooks(searchInput.value);
  });

  searchInput.addEventListener('input', () => {
    renderBooks(searchInput.value);
  });
}


let editingBookId = null;

function openEditModal(book) {
  editingBookId = book.id;

  document.getElementById('editTitle').value = book.title;
  document.getElementById('editAuthor').value = book.author;
  document.getElementById('editYear').value = book.year;
  document.getElementById('editIsComplete').checked = book.isComplete;

  const modal = document.getElementById('editModal');
  modal.classList.add('active');
}

function closeEditModal() {
  const modal = document.getElementById('editModal');
  modal.classList.remove('active');
  editingBookId = null;
}

function initEditModal() {
  const modal = document.getElementById('editModal');
  const closeBtn = document.getElementById('editModalClose');
  const cancelBtn = document.getElementById('editCancelBtn');
  const form = document.getElementById('editForm');

  closeBtn.addEventListener('click', closeEditModal);
  cancelBtn.addEventListener('click', closeEditModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeEditModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) closeEditModal();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('editTitle').value.trim();
    const author = document.getElementById('editAuthor').value.trim();
    const year = Number(document.getElementById('editYear').value);
    const isComplete = document.getElementById('editIsComplete').checked;

    if (!title || !author || !year) {
      showToast('⚠ Harap isi semua field!', 'error');
      return;
    }

    updateBook({ id: editingBookId, title, author, year, isComplete });
    renderBooks();
    closeEditModal();
    showToast(`"${title}" berhasil diperbarui!`, 'info');
  });
}


function showConfirm(message, onConfirm) {
  const overlay = document.getElementById('confirmModal');
  const msg = document.getElementById('confirmMessage');
  const confirmBtn = document.getElementById('confirmYes');
  const cancelBtn = document.getElementById('confirmNo');

  msg.textContent = message;
  overlay.classList.add('active');

  function cleanup() {
    overlay.classList.remove('active');
    confirmBtn.removeEventListener('click', onYes);
    cancelBtn.removeEventListener('click', onNo);
  }

  function onYes() {
    cleanup();
    onConfirm();
  }

  function onNo() {
    cleanup();
  }

  confirmBtn.addEventListener('click', onYes);
  cancelBtn.addEventListener('click', onNo);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) cleanup();
  });
}


function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `<span class="toast-icon">${icons[type] || '📢'}</span> ${message}`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}


document.addEventListener('DOMContentLoaded', () => {
  renderBooks();
  initAddForm();
  initSearch();
  initEditModal();
});
