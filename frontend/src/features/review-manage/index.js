import { showModal, hideModal } from "../../shared/ui/modal.js";
import { modal } from "../../shared/ui/dom.js";
import Toast from "../../shared/ui/toast.js";
import { reviewApi } from "../../entities/review/api.js";
import { loadReviews } from "../../widgets/reviews/index.js";
import { escapeHtml } from "../../shared/lib/escape-html.js";

export function showEditReviewModal(hotel, review) {
    showModal(`
        <h2>Редактировать отзыв</h2>
        <textarea class="edit-comment-input" rows="4">${escapeHtml(review.comment_text)}</textarea>
        <div style="margin: 12px 0;">
            <label>Оценка:</label>
            <div class="star-rating edit-stars" data-rating="${review.score}">
                <span class="star ${review.score >= 1 ? "active" : ""}" data-value="1">★</span>
                <span class="star ${review.score >= 2 ? "active" : ""}" data-value="2">★</span>
                <span class="star ${review.score >= 3 ? "active" : ""}" data-value="3">★</span>
                <span class="star ${review.score >= 4 ? "active" : ""}" data-value="4">★</span>
                <span class="star ${review.score >= 5 ? "active" : ""}" data-value="5">★</span>
            </div>
            <input type="hidden" class="edit-comment-score-input" value="${review.score}">
        </div>
        <button class="btn save-comment-btn">Сохранить</button>
        <button class="btn close-modal">Отмена</button>
    `);

    // Инициализация звездочек для редактирования
    const editStarRating = modal.querySelector(".edit-stars");
    const editStars = editStarRating.querySelectorAll(".star");
    const editScoreInput = modal.querySelector(".edit-comment-score-input");

    editStars.forEach((star) => {
        star.onclick = () => {
            const value = parseInt(star.getAttribute("data-value"));
            editScoreInput.value = value;
            editStarRating.setAttribute("data-rating", value);
            editStars.forEach((s, idx) => {
                if (idx < value) {
                    s.classList.add("active");
                } else {
                    s.classList.remove("active");
                }
            });
        };
    });

    modal.querySelector(".close-modal").onclick = hideModal;
    modal.querySelector(".save-comment-btn").onclick = async () => {
        const comment_text = modal
            .querySelector(".edit-comment-input")
            .value.trim();
        const score = modal.querySelector(".edit-comment-score-input").value;

        if (!comment_text) {
            Toast.warning("Отзыв не может быть пустым");
            return;
        }

        try {
            await reviewApi.update(
                hotel.id,
                review.id,
                comment_text,
                parseInt(score),
            );
            hideModal();
            Toast.success("Отзыв обновлен!");
            // Перезагружаем только отзывы
            await loadReviews(hotel);
        } catch (err) {
            Toast.error("Ошибка при обновлении отзыва");
        }
    };
}
