import { hotelDetailSection } from "../../shared/ui/dom.js";
import Toast from "../../shared/ui/toast.js";
import { getUser } from "../../entities/user/session.js";
import { reviewApi } from "../../entities/review/api.js";
import { showEditReviewModal } from "../../features/review-manage/index.js";
import { SVG_star } from "../../shared/ui/svg/star.js";
import { escapeHtml } from "../../shared/lib/escape-html.js";

export async function loadReviews(hotel) {
    const reviewsList = hotelDetailSection.querySelector(".reviews-list");
    const user = getUser();
    const isOwner =
        user &&
        (user.roles === "Admin" ||
            (user.roles === "Owner" && user.id === hotel.owner));

    try {
        const response = await reviewApi.list(hotel.id);
        const reviews = response.data || [];
        const userReview = reviews.find((r) => user && r.user_id === user.id);

        if (!reviews.length) {
            reviewsList.innerHTML = "<p>Отзывов пока нет</p>";
        } else {
            reviewsList.innerHTML = reviews
                .map(
                    (review) => `
                <div class="comment-card">
                    <div class="comment-header">
                        <div class="comment-user-info">
                            <b class="comment-author">${escapeHtml(review.user_name)}</b>
                            <span class="comment-score">${SVG_star} ${review.score}/5</span>
                        </div>
                        <span class="comment-date">${new Date(review.created_at).toLocaleDateString("ru-RU")}</span>
                    </div>
                    <p class="comment-text">${escapeHtml(review.comment_text)}</p>
                    ${
                        user &&
                        (user.id === review.user_id || user.roles === "Admin")
                            ? `
                        <div class="comment-actions">
                            <button class="btn-small edit-comment" data-review-id="${review.id}">Редактировать</button>
                            <button class="btn-small delete-comment" data-review-id="${review.id}">Удалить</button>
                        </div>
                    `
                            : ""
                    }
                </div>
            `,
                )
                .join("");
        }

        // Добавляем форму для добавления отзыва если пользователь авторизирован
        if (user && !isOwner) {
            if (userReview) {
                // Пользователь уже оставил отзыв, показываем кнопку редактирования
                const editHTML = `
                    <div class="add-comment-form" style="margin-top: 32px; border-top: 1px solid #ddd; padding-top: 20px;">
                        <h3>Ваш отзыв</h3>
                        <p>Вы уже оставили отзыв к этой гостинице.</p>
                        <button class="btn edit-own-review-btn" data-review-id="${userReview.id}">Редактировать мой отзыв</button>
                    </div>
                `;
                reviewsList.innerHTML += editHTML;
                hotelDetailSection.querySelector(
                    ".edit-own-review-btn",
                ).onclick = () => {
                    showEditReviewModal(hotel, userReview);
                };
            } else {
                // Пользователь еще не оставил отзыв, показываем форму
                const formHTML = `
                    <div class="add-comment-form" style="margin-top: 32px; border-top: 1px solid #ddd; padding-top: 20px;">
                        <h3>Добавить отзыв</h3>
                        <textarea class="comment-input" placeholder="Ваш отзыв..." rows="4"></textarea>
                        <div style="margin: 12px 0;">
                            <label>Оценка:</label>
                            <div class="star-rating" data-rating="5">
                                <span class="star active" data-value="1">★</span>
                                <span class="star active" data-value="2">★</span>
                                <span class="star active" data-value="3">★</span>
                                <span class="star active" data-value="4">★</span>
                                <span class="star active" data-value="5">★</span>
                            </div>
                            <input type="hidden" class="comment-score-input" value="5">
                        </div>
                        <button class="btn add-comment-btn">Отправить отзыв</button>
                    </div>
                `;
                reviewsList.innerHTML += formHTML;

                // Инициализация звездочек
                const starRating =
                    hotelDetailSection.querySelector(".star-rating");
                const stars = starRating.querySelectorAll(".star");
                const scoreInput = hotelDetailSection.querySelector(
                    ".comment-score-input",
                );

                stars.forEach((star) => {
                    star.onclick = () => {
                        const value = parseInt(star.getAttribute("data-value"));
                        scoreInput.value = value;
                        starRating.setAttribute("data-rating", value);
                        stars.forEach((s, idx) => {
                            if (idx < value) {
                                s.classList.add("active");
                            } else {
                                s.classList.remove("active");
                            }
                        });
                    };
                });

                // Обработчик кнопки добавления
                hotelDetailSection.querySelector(".add-comment-btn").onclick =
                    async () => {
                        const comment_text = hotelDetailSection
                            .querySelector(".comment-input")
                            .value.trim();
                        const score = hotelDetailSection.querySelector(
                            ".comment-score-input",
                        ).value;

                        if (!comment_text) {
                            Toast.warning("Пожалуйста, напишите отзыв");
                            return;
                        }

                        try {
                            await reviewApi.create(
                                hotel.id,
                                comment_text,
                                parseInt(score),
                            );
                            Toast.success("Отзыв успешно добавлен!");
                            // Перезагружаем только отзывы
                            await loadReviews(hotel);
                        } catch (err) {
                            Toast.error("Ошибка при добавлении отзыва");
                        }
                    };
            }
        } else if (user && isOwner) {
            const ownerHTML = `
                <div class="add-comment-form" style="margin-top: 32px; border-top: 1px solid #ddd; padding-top: 20px;">
                    <p style="color: #666; font-style: italic;">Вы не можете оставлять отзывы к своей собственной гостинице</p>
                </div>
            `;
            reviewsList.innerHTML += ownerHTML;
        }

        // Обработчики для удаления и редактирования
        reviewsList.querySelectorAll(".delete-comment").forEach((btn) => {
            btn.onclick = async () => {
                const reviewId = btn.getAttribute("data-review-id");
                if (confirm("Вы уверены, что хотите удалить отзыв?")) {
                    try {
                        await reviewApi.remove(hotel.id, reviewId);
                        Toast.success("Отзыв удален");
                        // Перезагружаем только отзывы
                        await loadReviews(hotel);
                    } catch (err) {
                        Toast.error("Ошибка при удалении отзыва");
                    }
                }
            };
        });

        reviewsList.querySelectorAll(".edit-comment").forEach((btn) => {
            btn.onclick = () => {
                const reviewId = btn.getAttribute("data-review-id");
                const review = reviews.find((r) => r.id === reviewId);
                showEditReviewModal(hotel, review);
            };
        });
    } catch (err) {
        reviewsList.textContent = "Ошибка загрузки отзывов";
    }
}
