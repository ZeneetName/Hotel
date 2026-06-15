import { showModal, hideModal } from "../../shared/ui/modal.js";
import { modal } from "../../shared/ui/dom.js";
import Toast from "../../shared/ui/toast.js";
import { getUser } from "../../entities/user/session.js";
import { amenityChipsHtml } from "../../entities/room/amenities.js";
import { setupRoomCarousel } from "../room-carousel/index.js";
import { showEditRoomModal, showDeleteRoomConfirm } from "../../features/room-manage/index.js";
import { showBookingModalForRoom } from "../../features/booking/index.js";
import { SVG_edit } from "../../shared/ui/svg/edit.js";
import { SVG_trash } from "../../shared/ui/svg/trash.js";
import { escapeHtml } from "../../shared/lib/escape-html.js";

export function showRoomDetailModal(room, hotel, isOwner) {
    const user = getUser();
    const stripHost = (u) => u.replace("http://localhost", "");
    let gallery = [];
    if (Array.isArray(room.images) && room.images.length) {
        gallery = room.images.map(stripHost);
    } else if (room.room_images) {
        gallery = [stripHost(room.room_images)];
    } else {
        gallery = ["https://source.unsplash.com/600x300/?room"];
    }

    const carouselHtml = `
        <div class="room-carousel" data-index="0">
            <div class="room-carousel-track">
                ${gallery
                    .map(
                        (src) =>
                            `<div class="room-carousel-slide" style="background-image:url('${src}')"></div>`,
                    )
                    .join("")}
            </div>
            ${
                gallery.length > 1
                    ? `
                <button class="room-carousel-btn room-carousel-prev" aria-label="Предыдущее фото">‹</button>
                <button class="room-carousel-btn room-carousel-next" aria-label="Следующее фото">›</button>
                <div class="room-carousel-counter"><span class="room-carousel-current">1</span> / ${gallery.length}</div>
                <div class="room-carousel-dots">
                    ${gallery
                        .map(
                            (_, i) =>
                                `<span class="room-carousel-dot${i === 0 ? " active" : ""}" data-dot="${i}"></span>`,
                        )
                        .join("")}
                </div>
            `
                    : ""
            }
        </div>
    `;

    showModal(`
        <div class="room-detail-modal">
            ${carouselHtml}
            <h2 style="text-align: center; margin-bottom: 16px;">${escapeHtml(room.title) || (room.type === "standard" ? "Стандартный номер" : "Люкс номер")}</h2>
            <div class="room-detail-modal-info">
                <h3>Информация о номере</h3>
                <div class="room-detail-modal-info-grid">
                    <div class="room-detail-modal-info-item">
                        <span class="label">Тип номера</span>
                        <span class="value">${room.type === "standard" ? "Стандартный" : "Люкс"}</span>
                    </div>
                    <div class="room-detail-modal-info-item">
                        <span class="label">Макс. гостей</span>
                        <span class="value">${room.max_place || "—"} человек</span>
                    </div>
                    <div class="room-detail-modal-info-item">
                        <span class="label">Площадь</span>
                        <span class="value">${room.square || "—"} м²</span>
                    </div>
                    <div class="room-detail-modal-info-item">
                        <span class="label">Цена</span>
                        <span class="value">${room.price_on_one_day} ₽/день</span>
                    </div>
                </div>
            </div>
            <div class="room-detail-modal-description">
                <h3>Описание</h3>
                <p>${escapeHtml(room.description) || "Описание отсутствует"}</p>
            </div>
            ${
                Array.isArray(room.amenities) && room.amenities.length
                    ? `<div class="room-detail-modal-amenities"><h3>Удобства</h3>${amenityChipsHtml(room.amenities)}</div>`
                    : ""
            }
            <div class="room-detail-modal-price">${room.price_on_one_day} ₽ за сутки</div>
            <div class="room-detail-modal-actions">
                ${isOwner ? `
                    <button class="btn edit-room-detail-btn" style="background: #667eea;">${SVG_edit} Редактировать</button>
                    <button class="btn delete-room-detail-btn" style="background: #dc3545;">${SVG_trash} Удалить</button>
                ` : `
                    <button class="btn book-room-detail-btn">Забронировать</button>
                `}
                <button class="btn close-room-detail-btn" style="background: #6c757d;">Закрыть</button>
            </div>
        </div>
    `);

    modal.querySelector(".close-room-detail-btn").onclick = hideModal;

    setupRoomCarousel(modal.querySelector(".room-carousel"), gallery.length);

    if (isOwner) {
        modal.querySelector(".edit-room-detail-btn").onclick = () => {
            hideModal();
            showEditRoomModal(hotel, room);
        };
        modal.querySelector(".delete-room-detail-btn").onclick = () => {
            hideModal();
            showDeleteRoomConfirm(hotel, room.id);
        };
    } else {
        modal.querySelector(".book-room-detail-btn").onclick = () => {
            if (!user) {
                hideModal();
                Toast.warning("Необходимо зарегистрироваться, чтобы забронировать");
                return;
            }
            hideModal();
            showBookingModalForRoom(room, hotel);
        };
    }
}
