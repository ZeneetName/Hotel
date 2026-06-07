import { modal } from "./dom.js";
import { pushState } from "../lib/history.js";

export function showModal(html) {
    modal.innerHTML = `<div class="modal-content">${html}</div>`;
    modal.style.display = "flex";
    // Добавляем запись в историю для модального окна
    pushState({ page: "modal", previousState: window.history.state }, "#modal");
}

export function hideModal() {
    modal.style.display = "none";
    // Если текущее состояние - модальное окно, возвращаемся назад
    if (window.history.state && window.history.state.page === "modal") {
        window.history.back();
    }
}
