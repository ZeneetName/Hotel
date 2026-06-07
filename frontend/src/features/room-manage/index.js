import { showModal, hideModal } from "../../shared/ui/modal.js";
import { modal } from "../../shared/ui/dom.js";
import Toast from "../../shared/ui/toast.js";
import { roomApi } from "../../entities/room/api.js";
import { amenitiesCheckboxesHtml, getSelectedAmenities } from "../../entities/room/amenities.js";
import { renderHotelDetail } from "../../pages/hotel-detail/index.js";

export function showEditRoomModal(hotel, room) {
    showModal(`
        <h2>Редактировать номер</h2>
        <input type="text" class="edit-room-title" value="${room.title || ""}" placeholder="Название номера">
        <label>Тип:
            <select class="room-type">
                <option value="standard" ${room.type === "standard" ? "selected" : ""}>Стандартный</option>
                <option value="deluxe" ${room.type === "deluxe" ? "selected" : ""}>Люкс</option>
            </select>
        </label>
        <label>Цена за день (₽): <input type="number" class="room-price" value="${room.price_on_one_day}"></label>
        <label>Количество мест: <input type="number" class="room-max-place" min="1" value="${room.max_place}"></label>
        <label>Площадь (м²): <input type="number" class="room-square" min="1" value="${room.square}"></label>
        <label>Описание: <textarea class="room-description" rows="3">${room.description || ""}</textarea></label>
        <div class="amenities-label">Удобства:</div>
        ${amenitiesCheckboxesHtml(Array.isArray(room.amenities) ? room.amenities : [])}
        <label>Фото: <input type="file" class="room-image" multiple accept="image/*"></label>
        <button class="btn save-edit-room-btn">Сохранить</button>
        <button class="btn close-modal">Отмена</button>
    `);
    modal.querySelector(".close-modal").onclick = hideModal;
    modal.querySelector(".save-edit-room-btn").onclick = async () => {
        const title = modal.querySelector(".edit-room-title").value.trim();
        const type = modal.querySelector(".room-type").value;
        const price = modal.querySelector(".room-price").value.trim();
        const max_place = modal.querySelector(".room-max-place").value.trim();
        const square = modal.querySelector(".room-square").value.trim();
        const description = modal.querySelector(".room-description").value.trim();
        const amenities = getSelectedAmenities(modal);
        const imageFiles = modal.querySelector(".room-image").files;

        if (!title || !price || !max_place || !square || !description) {
            Toast.warning("Заполните все обязательные поля");
            return;
        }

        try {
            if (imageFiles.length > 0) {
                const formData = new FormData();
                formData.append("title", title);
                formData.append("type", type);
                formData.append("price_on_one_day", parseInt(price));
                formData.append("max_place", parseInt(max_place));
                formData.append("square", parseInt(square));
                formData.append("description", description);
                formData.append("amenities", JSON.stringify(amenities));
                for (let file of imageFiles) {
                    formData.append("room_images", file);
                }
                await roomApi.updateWithImages(room.id, formData);
            } else {
                await roomApi.update(room.id, {
                    title: title,
                    type: type,
                    price_on_one_day: parseInt(price),
                    max_place: parseInt(max_place),
                    square: parseInt(square),
                    description: description,
                    amenities: amenities
                });
            }
            Toast.success("Номер обновлен");
            hideModal();
            await renderHotelDetail(hotel, true);
        } catch (err) {
            Toast.error("Ошибка обновления номера");
        }
    };
}

export function showCreateRoomModal(hotel) {
    showModal(`
        <h2>Добавить номер</h2>
        <label>Тип:
            <select class="room-type">
                <option value="standard">Стандартный</option>
                <option value="deluxe">Люкс</option>
            </select>
        </label>
        <label>Цена за день: <input type="number" class="room-price"></label>
        <label>Количество мест: <input type="number" class="room-max-place" min="1"></label>
        <label>Площадь (м²): <input type="number" class="room-square" min="1"></label>
        <label>Описание: <input type="text" class="room-description"></label>
        <div class="amenities-label">Удобства:</div>
        ${amenitiesCheckboxesHtml()}
        <label>Фото (несколько): <input type="file" class="room-image" multiple accept="image/*"></label>
        <button class="btn confirm-create-room">Создать</button>
        <button class="btn close-modal">Отмена</button>
    `);
    modal.querySelector(".close-modal").onclick = hideModal;
    modal.querySelector(".confirm-create-room").onclick = async () => {
        const type = modal.querySelector(".room-type").value;
        const price = modal.querySelector(".room-price").value.trim();
        const max_place = modal.querySelector(".room-max-place").value.trim();
        const square = modal.querySelector(".room-square").value.trim();
        const description = modal
            .querySelector(".room-description")
            .value.trim();
        const imageFiles = modal.querySelector(".room-image").files;
        if (!price || !max_place || !square || !description || !imageFiles.length) {
            Toast.warning("Заполните все поля и выберите минимум одно фото");
            return;
        }
        const formData = new FormData();
        formData.append(
            "title",
            type === "standard" ? "Стандартный номер" : "Люкс номер",
        );
        formData.append("type", type);
        formData.append("price_on_one_day", price);
        formData.append("max_place", max_place);
        formData.append("square", square);
        formData.append("description", description);
        formData.append("amenities", JSON.stringify(getSelectedAmenities(modal)));
        for (let file of imageFiles) {
            formData.append("room_images", file);
        }
        try {
            await roomApi.create(hotel.id, formData);
            hideModal();
            Toast.success("Номер успешно добавлен!");
            await renderHotelDetail(hotel, true);
        } catch (err) {
            const msg = typeof err === "object" ? JSON.stringify(err) : err;
            Toast.error("Ошибка создания номера");
        }
    };
}

export function showDeleteRoomConfirm(hotel, roomId) {
    showModal(`
        <div class="confirm-dialog">
            <div class="confirm-icon">⚠️</div>
            <h2>Удаление номера</h2>
            <p class="confirm-message">Вы уверены, что хотите удалить этот номер?</p>
            <p class="confirm-warning">Это действие нельзя отменить.</p>
            <div class="confirm-actions">
                <button class="btn confirm-delete-room-btn" style="background: #dc3545;">Удалить</button>
                <button class="btn cancel-delete-room-btn">Отмена</button>
            </div>
        </div>
    `);

    modal.querySelector(".cancel-delete-room-btn").onclick = hideModal;
    modal.querySelector(".confirm-delete-room-btn").onclick = async () => {
        try {
            await roomApi.remove(roomId);
            hideModal();
            Toast.success("Номер удален");
            await renderHotelDetail(hotel, true);
        } catch (err) {
            Toast.error("Ошибка при удалении номера");
        }
    };
}
