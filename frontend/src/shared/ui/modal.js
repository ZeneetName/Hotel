import { modal } from "./dom.js";
import { pushState } from "../lib/history.js";

// Флаг: текущий popstate вызван закрытием модалки (X / Отмена / Escape),
// а не реальной навигацией. Роутер должен пропустить перерисовку страницы.
let closingModal = false;
export function consumeModalClose() {
    const wasClosing = closingModal;
    closingModal = false;
    return wasClosing;
}

export function showModal(html) {
    modal.innerHTML = `<div class="modal-content"><button class="modal-x" aria-label="Закрыть" title="Закрыть">✕</button>${html}</div>`;
    modal.style.display = "flex";
    const x = modal.querySelector(".modal-x");
    if (x) x.onclick = hideModal;
    // Показываем имя выбранного файла в полях-скрепках
    modal.onchange = handleFileFieldChange;
    // Добавляем запись в историю для модального окна
    pushState({ page: "modal", previousState: window.history.state }, "#modal");
}

function handleFileFieldChange(e) {
    const input = e.target;
    if (!input.matches || !input.matches(".file-field input[type=file]")) return;
    const field = input.closest(".file-field");
    const textEl = field.querySelector(".file-field-text");
    const files = input.files;
    if (files && files.length) {
        textEl.textContent =
            files.length === 1 ? files[0].name : `Выбрано файлов: ${files.length}`;
        field.classList.add("file-field--filled");
    } else {
        textEl.textContent = input.multiple ? "Прикрепить фото (можно несколько)" : "Прикрепить фото";
        field.classList.remove("file-field--filled");
    }
}

export function hideModal() {
    modal.style.display = "none";
    // Если текущее состояние - модальное окно, убираем его запись из истории.
    // Помечаем флагом, чтобы роутер не перерисовывал страницу под модалкой —
    // пользователь остаётся ровно там, где был (та же позиция скролла).
    if (window.history.state && window.history.state.page === "modal") {
        closingModal = true;
        window.history.back();
    }
}
