import { showModal, hideModal } from "../../shared/ui/modal.js";
import { showSection, hideAllSections, hotelDetailSection, modal } from "../../shared/ui/dom.js";
import { pushState } from "../../shared/lib/history.js";
import Toast from "../../shared/ui/toast.js";
import { hotelApi } from "../../entities/hotel/api.js";
import { renderHotels } from "../../pages/hotels/index.js";
import { renderHotelDetail } from "../../pages/hotel-detail/index.js";

export function showCreateHotelModal() {
    showModal(`
        <h2>Добавить объявление</h2>
        <label>Название: <input type="text" class="hotel-title"></label>
        <label>Описание: <input type="text" class="hotel-description desc_hotel_add"></label>
        <label>Адрес: <input type="text" class="hotel-address"></label>
        <label>Город: <input type="text" class="hotel-city"></label>
        <label>Фото (несколько): <input type="file" class="hotel-image" multiple accept="image/*"></label>
        <button class="btn confirm-create-hotel">Создать</button>
        <button class="btn close-modal">Отмена</button>
    `);
    modal.querySelector(".close-modal").onclick = hideModal;
    modal.querySelector(".confirm-create-hotel").onclick = async () => {
        const title = modal.querySelector(".hotel-title").value.trim();
        const description = modal
            .querySelector(".hotel-description")
            .value.trim();
        const address = modal.querySelector(".hotel-address").value.trim();
        const city = modal.querySelector(".hotel-city").value.trim();
        const imageFiles = modal.querySelector(".hotel-image").files;
        if (!title || !description || !address || !imageFiles.length) {
            Toast.warning("Заполните все поля и выберите минимум одно фото");
            return;
        }
        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("address", address);
        formData.append("city", city);
        for (let file of imageFiles) {
            formData.append("hostel_images", file);
        }
        try {
            await hotelApi.create(formData);
            hideModal();
            Toast.success("Жильё успешно добавлено!");
            renderHotels();
        } catch (err) {
            const msg = typeof err === "object" ? JSON.stringify(err) : err;
            Toast.error("Ошибка создания отеля");
        }
    };
}

export function showEditHotelPage(hotel) {
    showSection(hotelDetailSection);
    pushState({ page: 'edit-hotel', hotelId: hotel.id }, `#edit-hotel/${hotel.id}`);

    hotelDetailSection.innerHTML = `
        <div class="edit-hotel-page">
            <button class="btn back-btn">← Назад к гостинице</button>
            <h1>Редактирование гостиницы</h1>
            <div class="edit-hotel-form">
                <div class="form-group">
                    <label>Название гостиницы</label>
                    <input type="text" class="hotel-title-input" value="${hotel.title || ""}" placeholder="Введите название">
                </div>
                <div class="form-group">
                    <label>Город</label>
                    <input type="text" class="hotel-city-input" value="${hotel.city || ""}" placeholder="Введите город">
                </div>
                <div class="form-group">
                    <label>Адрес</label>
                    <input type="text" class="hotel-address-input" value="${hotel.address || ""}" placeholder="Введите адрес">
                </div>
                <div class="form-group">
                    <label>Описание</label>
                    <textarea class="hotel-description-input" rows="6" placeholder="Введите описание">${hotel.description || ""}</textarea>
                </div>
                <div class="form-group">
                    <label>Текущее фото</label>
                    <div class="current-image-preview" style="background-image:url('${hotel.hostel_images ? hotel.hostel_images.replace("http://localhost", "") : "https://source.unsplash.com/400x200/?hotel"}')"></div>
                </div>
                <div class="form-group">
                    <label>Новые фото (несколько, необязательно)</label>
                    <input type="file" class="hotel-image-input" multiple accept="image/*">
                </div>
                <div class="form-actions">
                    <button class="btn save-hotel-btn">Сохранить изменения</button>
                    <button class="btn cancel-edit-btn">Отмена</button>
                </div>
            </div>
        </div>
    `;

    hotelDetailSection.querySelector(".back-btn").onclick = () => renderHotelDetail(hotel);
    hotelDetailSection.querySelector(".cancel-edit-btn").onclick = () => renderHotelDetail(hotel);

    hotelDetailSection.querySelector(".save-hotel-btn").onclick = async () => {
        const title = hotelDetailSection.querySelector(".hotel-title-input").value.trim();
        const city = hotelDetailSection.querySelector(".hotel-city-input").value.trim();
        const address = hotelDetailSection.querySelector(".hotel-address-input").value.trim();
        const description = hotelDetailSection.querySelector(".hotel-description-input").value.trim();
        const imageFiles = hotelDetailSection.querySelector(".hotel-image-input").files;

        if (!title || !address || !description) {
            Toast.warning("Заполните обязательные поля: название, адрес, описание");
            return;
        }

        try {
            if (imageFiles.length > 0) {
                const formData = new FormData();
                formData.append("title", title);
                formData.append("city", city);
                formData.append("address", address);
                formData.append("description", description);
                for (let file of imageFiles) {
                    formData.append("hostel_images", file);
                }
                await hotelApi.updateWithImages(hotel.id, formData);
            } else {
                await hotelApi.update(hotel.id, { title, city, address, description });
            }
            Toast.success("Гостиница успешно обновлена!");
            const updatedHotel = { ...hotel, title, city, address, description };
            renderHotelDetail(updatedHotel);
        } catch (err) {
            Toast.error("Ошибка при обновлении гостиницы");
        }
    };
}

export function showDeleteHotelConfirm(hotel) {
    showModal(`
        <div class="confirm-dialog">
            <div class="confirm-icon">⚠️</div>
            <h2>Удаление гостиницы</h2>
            <p class="confirm-message">Вы уверены, что хотите удалить гостиницу "${hotel.title}"?</p>
            <p class="confirm-warning">Это действие нельзя отменить. Все номера и бронирования будут удалены.</p>
            <div class="confirm-actions">
                <button class="btn confirm-delete-btn" style="background: #dc3545;">Удалить</button>
                <button class="btn cancel-delete-btn">Отмена</button>
            </div>
        </div>
    `);

    modal.querySelector(".cancel-delete-btn").onclick = hideModal;
    modal.querySelector(".confirm-delete-btn").onclick = async () => {
        try {
            await hotelApi.remove(hotel.id);
            hideModal();
            Toast.success("Гостиница успешно удалена");
            hideAllSections();
            renderHotels();
        } catch (err) {
            Toast.error("Ошибка при удалении гостиницы");
        }
    };
}
