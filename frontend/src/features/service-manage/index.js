import { showModal, hideModal } from "../../shared/ui/modal.js";
import { modal, hotelDetailSection } from "../../shared/ui/dom.js";
import Toast from "../../shared/ui/toast.js";
import { serviceApi } from "../../entities/service/api.js";
import { fileFieldHtml } from "../../shared/ui/fileField.js";

function openServicesTab() {
    const servicesBtn = hotelDetailSection.querySelector(
        '.additional-btn[data-type="services"]',
    );
    servicesBtn?.click();
}

export function showCreateServiceModal(hotel) {
    showModal(`
        <h2>Добавить услугу</h2>
        <input type="text" class="service-title" placeholder="Название услуги">
        <label>Цена (₽): <input type="number" class="service-price" min="0"></label>
        <label>Длительность (мин): <input type="number" class="service-duration" min="1"></label>
        ${fileFieldHtml("Фото", "service-image")}
        <button class="btn save-service-btn">Сохранить</button>
        <button class="btn close-modal">Отмена</button>
    `);
    modal.querySelector(".close-modal").onclick = hideModal;
    modal.querySelector(".save-service-btn").onclick = async () => {
        const title = modal.querySelector(".service-title").value.trim();
        const price = modal.querySelector(".service-price").value.trim();
        const duration = modal.querySelector(".service-duration").value.trim();
        const imageFile = modal.querySelector(".service-image").files[0];

        if (!title || !price || !duration || !imageFile) {
            Toast.warning("Заполните все поля и выберите фото");
            return;
        }

        const formData = new FormData();
        formData.append("title", title);
        formData.append("price", price);
        formData.append("duration", duration);
        formData.append("service_images", imageFile);
        formData.append("hotel", hotel.id);

        try {
            await serviceApi.create(hotel.id, formData);
            Toast.success("Услуга добавлена");
            hideModal();
            openServicesTab();
        } catch (err) {
            const msg = typeof err === "object" ? JSON.stringify(err) : err;
            Toast.error("Ошибка добавления услуги: " + msg);
        }
    };
}

export function showEditServiceModal(hotel, service) {
    showModal(`
        <h2>Редактировать услугу</h2>
        <input type="text" class="edit-service-title" value="${service.title}" placeholder="Название услуги">
        <label>Цена (₽): <input type="number" class="edit-service-price" value="${service.price}" min="0"></label>
        <label>Длительность (мин): <input type="number" class="edit-service-duration" value="${service.duration}" min="1"></label>
        ${service.service_images ? `<img src="${service.service_images}" class="service-image-preview" alt="Текущее фото">` : ""}
        ${fileFieldHtml("Новое фото", "edit-service-image")}
        <button class="btn save-edit-service-btn">Сохранить</button>
        <button class="btn close-modal">Отмена</button>
    `);
    modal.querySelector(".close-modal").onclick = hideModal;
    modal.querySelector(".save-edit-service-btn").onclick = async () => {
        const title = modal.querySelector(".edit-service-title").value.trim();
        const price = modal.querySelector(".edit-service-price").value.trim();
        const duration = modal
            .querySelector(".edit-service-duration")
            .value.trim();
        const imageFile = modal.querySelector(".edit-service-image").files[0];

        if (!title || !price || !duration) {
            Toast.warning("Заполните все обязательные поля");
            return;
        }

        const data = { title, price, duration };

        try {
            if (imageFile) {
                const formData = new FormData();
                formData.append("title", title);
                formData.append("price", price);
                formData.append("duration", duration);
                formData.append("service_images", imageFile);
                await serviceApi.updateWithImages(service.id, formData);
            } else {
                await serviceApi.update(service.id, data);
            }
            Toast.success("Услуга обновлена");
            hideModal();
            openServicesTab();
        } catch (err) {
            const msg = typeof err === "object" ? JSON.stringify(err) : err;
            Toast.error("Ошибка обновления услуги: " + msg);
        }
    };
}
