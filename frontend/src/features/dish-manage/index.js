import { showModal, hideModal } from "../../shared/ui/modal.js";
import { modal, hotelDetailSection } from "../../shared/ui/dom.js";
import Toast from "../../shared/ui/toast.js";
import { dishApi } from "../../entities/dish/api.js";
import { fileFieldHtml } from "../../shared/ui/fileField.js";
import { renderHotelDetail } from "../../pages/hotel-detail/index.js";

function openMenuTab() {
    const menuBtn = hotelDetailSection.querySelector(
        '.additional-btn[data-type="menu"]',
    );
    menuBtn?.click();
}

export function showCreateDishModal(hotel) {
    showModal(`
        <h2>Добавить блюдо</h2>
        <input type="text" class="dish-title" placeholder="Название блюда">
        <textarea class="dish-composition" placeholder="Состав блюда..." rows="5"></textarea>
        <label>Вес (г): <input type="number" class="dish-weight" min="1"></label>
        <label>Цена (₽): <input type="number" class="dish-price" min="0"></label>
        ${fileFieldHtml("Фото", "dish-image")}
        <button class="btn save-dish-btn">Сохранить</button>
        <button class="btn close-modal">Отмена</button>
    `);
    modal.querySelector(".close-modal").onclick = hideModal;
    modal.querySelector(".save-dish-btn").onclick = async () => {
        const title = modal.querySelector(".dish-title").value.trim();
        const composition = modal.querySelector(".dish-composition").value.trim();
        const weight = modal.querySelector(".dish-weight").value.trim();
        const price = modal.querySelector(".dish-price").value.trim();
        const imageFile = modal.querySelector(".dish-image").files[0];

        if (!title || !composition || !weight || !price || !imageFile) {
            Toast.warning("Заполните все поля и выберите фото");
            return;
        }

        const formData = new FormData();
        formData.append("title", title);
        formData.append("composition", composition);
        formData.append("weight", weight);
        formData.append("price", price);
        formData.append("dish_images", imageFile);
        formData.append("hotel", hotel.id);

        try {
            await dishApi.create(hotel.id, formData);
            Toast.success("Блюдо добавлено");
            hideModal();
            // Обновляем страницу отеля без добавления в историю
            await renderHotelDetail(hotel, true);
            // Автоматически открываем вкладку меню
            openMenuTab();
        } catch (err) {
            const msg = typeof err === "object" ? JSON.stringify(err) : err;
            Toast.error("Ошибка добавления блюда: " + msg);
        }
    };
}

export function showEditDishModal(hotel, dish) {
    showModal(`
        <h2>Редактировать блюдо</h2>
        <input type="text" class="edit-dish-title" value="${dish.title}" placeholder="Название блюда">
        <textarea class="edit-dish-composition" rows="5">${dish.composition}</textarea>
        <label>Вес (г): <input type="number" class="edit-dish-weight" value="${dish.weight}" min="1"></label>
        <label>Цена (₽): <input type="number" class="edit-dish-price" value="${dish.price}" min="0"></label>
        ${dish.dish_images ? `<img src="${dish.dish_images}" class="dish-image-preview" alt="Текущее фото">` : ""}
        ${fileFieldHtml("Новое фото", "edit-dish-image")}
        <button class="btn save-edit-dish-btn">Сохранить</button>
        <button class="btn close-modal">Отмена</button>
    `);
    modal.querySelector(".close-modal").onclick = hideModal;
    modal.querySelector(".save-edit-dish-btn").onclick = async () => {
        const title = modal.querySelector(".edit-dish-title").value.trim();
        const composition = modal
            .querySelector(".edit-dish-composition")
            .value.trim();
        const weight = modal.querySelector(".edit-dish-weight").value.trim();
        const price = modal.querySelector(".edit-dish-price").value.trim();
        const imageFile = modal.querySelector(".edit-dish-image").files[0];

        if (!title || !composition || !weight || !price) {
            Toast.warning("Заполните все обязательные поля");
            return;
        }

        const data = { title, composition, weight, price };

        try {
            if (imageFile) {
                const formData = new FormData();
                formData.append("title", title);
                formData.append("composition", composition);
                formData.append("weight", weight);
                formData.append("price", price);
                formData.append("dish_images", imageFile);
                await dishApi.updateWithImages(dish.id, formData);
            } else {
                await dishApi.update(dish.id, data);
            }
            Toast.success("Блюдо обновлено");
            hideModal();
            openMenuTab();
        } catch (err) {
            const msg = typeof err === "object" ? JSON.stringify(err) : err;
            Toast.error("Ошибка обновления блюда: " + msg);
        }
    };
}
