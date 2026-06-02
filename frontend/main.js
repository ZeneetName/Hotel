import API from "./api.js";
import Toast from "./notifications.js";

const hotelsList = document.querySelector(".hotels-list");
const authSection = document.querySelector(".auth-section");
const profileSection = document.querySelector(".profile-section");
const bookingsSection = document.querySelector(".bookings-section");
const hotelDetailSection = document.querySelector(".hotel-detail-section");
const header = document.querySelector(".header");
const btnLogin = document.querySelector(".login");
const btnProfile = document.querySelector(".profile");
const btnBookings = document.querySelector(".my-bookings");
const btnCreateHotel = document.querySelector(".create-hotel-btn");
const modal = document.querySelector(".modal");

function showSection(section) {
    [authSection, profileSection, bookingsSection, hotelDetailSection].forEach(
        (s) => (s.style.display = "none"),
    );
    const hotelsSection = document.querySelector(".hotels-section");
    hotelsSection.style.display =
        section === hotelDetailSection ||
        section === authSection ||
        section === profileSection ||
        section === bookingsSection
            ? "none"
            : "block";
    section.style.display = "block";

    if (section === authSection) {
        section.style.display = "flex";
        header.style.display = "none"
    }
    else if (section === profileSection){
        section.style.display = "flex";
        header.style.display = "flex"
        }
    else {
        section.style.display = "block";
        header.style.display = "flex"
    }

}

function pushState(state, url) {
    window.history.pushState(state, "", url);
}

function hideAllSections() {
    [authSection, profileSection, bookingsSection, hotelDetailSection].forEach(
        (s) => (s.style.display = "none"),
    );
    document.querySelector(".hotels-section").style.display = "block";

     header.style.display = "flex"
}
function showModal(html) {
    modal.innerHTML = `<div class="modal-content">${html}</div>`;
    modal.style.display = "flex";
    // Добавляем запись в историю для модального окна
    pushState({ page: "modal", previousState: window.history.state }, "#modal");
}

function hideModal() {
    modal.style.display = "none";
    // Если текущее состояние - модальное окно, возвращаемся назад
    if (window.history.state && window.history.state.page === "modal") {
        window.history.back();
    }
}

function setHeaderAuth(isAuth) {
    btnLogin.style.display = isAuth ? "none" : "inline-block";
    btnProfile.style.display = isAuth ? "inline-block" : "none";
    btnBookings.style.display = isAuth ? "inline-block" : "none";
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const canCreate =
        isAuth && user && (user.roles === "Admin" || user.roles === "Owner");
    btnCreateHotel.style.display = canCreate ? "block" : "none";
}

function getUser() {
    return localStorage.getItem("token")
        ? JSON.parse(localStorage.getItem("user") || "{}")
        : null;
}
function setUser(user, token) {
    if (user && token) {
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", token);
    }
}
function logout() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setHeaderAuth(false);
    renderHotels();
}

// --- Аутентификация ---
function renderAuthForm(skipHistory = false) {
    showSection(authSection);
    if (!skipHistory) pushState({ page: "login" }, "#login");
    authSection.innerHTML = `
        <div class="auth-form">
            <h2>Вход</h2>
            <input type="email" class="auth-email" placeholder="Email">
            <input type="password" class="auth-password" placeholder="Пароль">
            <button class="btn auth-login">Войти</button>
            <p>Нет аккаунта? <a href="#" class="to-register">Зарегистрироваться</a></p>
        </div>
    `;
    authSection.querySelector(".auth-login").onclick = async () => {
        const email = authSection.querySelector(".auth-email").value;
        const password = authSection.querySelector(".auth-password").value;
        
        if (!email || !password) {
            Toast.error("Заполните email и пароль");
            return;
        }
        
        try {
            const data = await API.login(email, password);
            setUser(data.user, data.token);
            setHeaderAuth(true);
            hideAllSections();
            renderHotels();
            Toast.success("Вы успешно вошли!");
        } catch (err) {
            const message = err?.error || err?.detail || "Проверьте email и пароль";
            Toast.error(message);
        }
    };
    authSection.querySelector(".to-register").onclick = (e) => {
        e.preventDefault();
        renderRegisterForm();
    };
}
function renderRegisterForm(skipHistory = false) {
    showSection(authSection);
    if (!skipHistory) pushState({ page: "register" }, "#register");
    authSection.innerHTML = `
        <div class="auth-form">
            <h2>Регистрация</h2>
            <input type="email" class="reg-email" placeholder="Email">
            <input type="password" class="reg-password" placeholder="Пароль">
            <input type="text" class="reg-fullname" placeholder="Полное имя">
            <input type="text" class="reg-phone" placeholder="Телефон (+7...)">
            <button class="btn auth-register">Зарегистрироваться</button>
            <p>Есть аккаунт? <a href="#" class="to-login">Войти</a></p>
        </div>
    `;
    authSection.querySelector(".auth-register").onclick = async () => {
        const email = authSection.querySelector(".reg-email").value;
        const password = authSection.querySelector(".reg-password").value;
        const full_name = authSection.querySelector(".reg-fullname").value;
        const phone = authSection.querySelector(".reg-phone").value;
        try {
            const data = await API.register(email, password, full_name, phone);
            setUser(data.user, data.token);
            setHeaderAuth(true);
            hideAllSections();
            renderHotels();
            Toast.success("Вы успешно зарегистрировались!");
        } catch (err) {
            Toast.error("Ошибка регистрации");
        }
    };
    authSection.querySelector(".to-login").onclick = (e) => {
        e.preventDefault();
        renderAuthForm();
    };
}

// --- Профиль ---
async function renderProfile(skipHistory = false) {
    showSection(profileSection);
    if (!skipHistory) pushState({ page: "profile" }, "#profile");
    profileSection.innerHTML =
        "<div class='profile-container'><h2>Профиль</h2><div class='profile-content'>Загрузка...</div><button class='btn logout-btn'>Выйти</button></div>";
    try {
        const user = await API.getProfile();
        const roleText =
            user.roles === "Admin"
                ? "Администратор"
                : user.roles === "Owner"
                  ? "Владелец"
                  : "Пользователь";
        const avatarInitial = user.full_name.charAt(0).toUpperCase();

        profileSection.querySelector(".profile-content").innerHTML = `
            <div class="profile-layout">
                <div class="profile-left">
                    <div class="profile-avatar-large">${avatarInitial}</div>
                    <h3 class="h3-profile-full_name">${user.full_name}</h3>
                    <div class="profile-role-badge">${roleText}</div>
                </div>
                <div class="profile-right">
                    <div class="profile-info-card">
                        <div class="profile-details">
                            <div class="profile-detail-item">
                                <span class="profile-detail-icon">📧</span>
                                <div class="profile-detail-content">
                                    <span class="profile-detail-label">Email</span>
                                    <span class="profile-detail-value">${user.email || "—"}</span>
                                </div>
                            </div>
                            ${
                                user.phone
                                    ? `
                            <div class="profile-detail-item">
                                <span class="profile-detail-icon">📱</span>
                                <div class="profile-detail-content">
                                    <span class="profile-detail-label">Телефон</span>
                                    <span class="profile-detail-value">${user.phone}</span>
                                </div>
                            </div>
                            `
                                    : ""
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch {
        profileSection.querySelector(".profile-content").innerHTML =
            "<div style='color: #dc3545;'>Ошибка загрузки профиля</div>";
    }
    profileSection.querySelector(".logout-btn").onclick = logout;
}

// --- Бронирования ---
async function renderBookings(skipHistory = false) {
    showSection(bookingsSection);
    if (!skipHistory) pushState({ page: "bookings" }, "#bookings");
    bookingsSection.innerHTML =
        "<h2>Мои бронирования</h2><div class='bookings-list'>Загрузка...</div>";
    try {
        const bookings = await API.getBookings();
        const list = bookingsSection.querySelector(".bookings-list");
        if (!bookings.length) {
            list.textContent = "Нет бронирований";
            return;
        }
        list.innerHTML = "";
        bookings.forEach((b) => {
            const el = document.createElement("div");
            el.className = "booking-card";
            el.innerHTML = `
                <b>${b.hotel_name || "Гостиница"}</b>
                <span>Номер: ${b.room_title || "—"}</span><br>
                <span>Заезд: ${b.check_in || "—"}</span><br>
                <span>Выезд: ${b.check_out || "—"}</span><br>
                <span><b>Итого: ${b.total_price || 0} руб</b></span>
            `;
            list.append(el);
        });
    } catch {
        bookingsSection.querySelector(".bookings-list").textContent =
            "Ошибка загрузки";
    }
}

// --- Гостиницы ---
async function renderHotels(skipHistory = false) {
    hideAllSections();
    if (!skipHistory) {
        pushState({ page: "hotels" }, "#hotels");
    }
    hotelsList.innerHTML = "Загрузка...";
    try {
        const hotels = await API.getHotels();
        hotelsList.innerHTML = "";
        hotels.forEach((hotel) => {
            const card = document.createElement("div");
            card.className = "hotel-card";
            card.style.cursor = "pointer";
            card.innerHTML = `
                <div class="hotel-img" style="background-image:url('${hotel.hostel_images ? hotel.hostel_images.replace("http://localhost", "") : "https://source.unsplash.com/400x200/?hotel"}')"></div>
                <div class="hotel-info">
                    <h2>${hotel.title}</h2>
                    <p><b>Город:</b> ${hotel.city || "—"}</p>
                    <p><b>Адрес:</b> ${hotel.address || "—"}</p>
                    ${hotel.min_price ? `<p style="color: #000000; font-weight: bold; margin-top: 10px;">От ${hotel.min_price} ₽</p>` : ""}
                </div>
            `;
            card.onclick = () => renderHotelDetail(hotel);
            hotelsList.append(card);
        });
    } catch {
        hotelsList.innerHTML = "Ошибка загрузки гостиниц";
    }
}

async function renderHotelDetail(hotel, skipHistory = false) {
    showSection(hotelDetailSection);
    if (!skipHistory)
        pushState(
            { page: "hotel", hotelId: hotel.id, hotel: hotel },
            `#hotel/${hotel.id}`,
        );
    const user = getUser();
    const isOwner =
        user &&
        (user.roles === "Admin" ||
            (user.roles === "Owner" && user.id === hotel.owner));
    hotelDetailSection.innerHTML = `
        <div class="hotel-detail">
            <div class="hotel-detail-header">
                <button class="btn back-btn">← Назад</button>
                ${isOwner ? `<div class="hotel-actions"><button class='btn btn-small edit-hotel-btn'>✏️ Редактировать</button><button class='btn btn-small delete-hotel-btn' style="background: #dc3545;">🗑️ Удалить</button></div>` : ""}
            </div>
            <h1 class="hotel-detail-title">${hotel.title}</h1>
            <div class="hotel-detail-img" style="background-image:url('${hotel.hostel_images ? hotel.hostel_images.replace("http://localhost", "") : "https://source.unsplash.com/800x400/?hotel"}')" ></div>
            <div class="hotel-rooms-section">
                <div class="rooms-header">
                    <h2>Номера</h2>
                    ${isOwner ? "<button class='btn add-room-btn'>+ Добавить номер</button>" : ""}
                </div>
                <div class="rooms-list">Загрузка...</div>
            </div>
            <div class="hotel-info-section">
                <h2>Информация</h2>
                <p><b>Адрес:</b> ${hotel.address || "—"}</p>
                <p><b>Город:</b> ${hotel.city || "—"}</p>
            </div>
            <div class="hotel-description-section">
                <h2>Описание</h2>
                <p>${hotel.description || "Нет описания"}</p>
            </div>
            <div class="hotel-additional-section">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h2>Дополнительно</h2>
                    ${
                        isOwner
                            ? `
                        <div>
                            <button class="btn btn-small add-menu-btn" style="margin-right: 8px;">+ Добавить меню</button>
                            <button class="btn btn-small add-service-btn">+ Добавить услугу</button>
                        </div>
                    `
                            : ""
                    }
                </div>
                <div style="display: flex; gap: 16px; margin-top: 16px;">
                    <button class="btn additional-btn" data-type="menu">Меню</button>
                    <button class="btn additional-btn" data-type="services">Услуги</button>
                </div>
                <div class="additional-content" style="margin-top: 16px; display: none;"></div>
            </div>
            <div class="hotel-reviews-section">
                <h2>Отзывы</h2>
                <div class="reviews-list">Отзывов пока нет</div>
            </div>
        </div>
    `;
    hotelDetailSection.querySelector(".back-btn").onclick = () => {
        hideAllSections();
        renderHotels();
    };
    
    // Обработчики для редактирования и удаления гостиницы
    if (isOwner) {
        const editHotelBtn = hotelDetailSection.querySelector(".edit-hotel-btn");
        const deleteHotelBtn = hotelDetailSection.querySelector(".delete-hotel-btn");
        
        if (editHotelBtn) {
            editHotelBtn.onclick = () => showEditHotelPage(hotel);
        }
        
        if (deleteHotelBtn) {
            deleteHotelBtn.onclick = () => showDeleteHotelConfirm(hotel);
        }
    }

    // Обработчики для дополнительного раздела
    const additionalBtns =
        hotelDetailSection.querySelectorAll(".additional-btn");
    const additionalContent = hotelDetailSection.querySelector(
        ".additional-content",
    );

    additionalBtns.forEach((btn) => {
        btn.onclick = async () => {
            const type = btn.getAttribute("data-type");
            additionalBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            additionalContent.style.display = "block";

            try {
                let items = [];
                if (type === "menu") {
                    const res = await API.getDishes(hotel.id);
                    items = res.data || res;
                    if (!items || !items.length) {
                        additionalContent.innerHTML = `
                            <h3>Меню</h3>
                            <p class="text-muted">Меню гостиницы не добавлено</p>
                        `;
                    } else {
                        additionalContent.innerHTML = `
                            <h3>Меню</h3>
                            <div class="dishes-grid">
                                ${items
                                    .map(
                                        (dish) => `
                                    <div class="dish-card">
                                        ${dish.dish_images ? `<img src="${dish.dish_images}" alt="${dish.title}">` : ""}
                                        <h4>${dish.title}</h4>
                                        <p class="dish-composition">${dish.composition}</p>
                                        <p class="dish-weight">${dish.weight}г</p>
                                        <p class="dish-price">${dish.price} ₽</p>
                                        ${
                                            isOwner
                                                ? `
                                        <div class="dish-card-actions">
                                            <button class="btn-small edit-dish-btn" data-dish-id="${dish.id}">✏️</button>
                                            <button class="btn-small delete-dish-btn" data-dish-id="${dish.id}">🗑️</button>
                                        </div>
                                        `
                                                : ""
                                        }
                                    </div>
                                `,
                                    )
                                    .join("")}
                            </div>
                        `;
                    }
                } else if (type === "services") {
                    const res = await API.getServices(hotel.id);
                    items = res.data || res;
                    if (!items || !items.length) {
                        additionalContent.innerHTML = `
                            <h3>Услуги</h3>
                            <p class="text-muted">Услуги не добавлены</p>
                        `;
                    } else {
                        additionalContent.innerHTML = `
                            <h3>Услуги</h3>
                            <div class="services-list">
                                ${items
                                    .map(
                                        (service) => `
                                    <div class="service-card">
                                        ${service.service_images ? `<img src="${service.service_images}" alt="${service.title}">` : `<div class="service-placeholder"></div>`}
                                        <div class="service-info">
                                            <h4>${service.title}</h4>
                                            <p class="service-duration">Длительность: ${service.duration} мин</p>
                                            <p class="service-price">${service.price} ₽</p>
                                        </div>
                                        ${
                                            isOwner
                                                ? `
                                        <div class="service-card-actions">
                                            <button class="btn-small edit-service-btn" data-service-id="${service.id}">✏️</button>
                                            <button class="btn-small delete-service-btn" data-service-id="${service.id}">🗑️</button>
                                        </div>
                                        `
                                                : ""
                                        }
                                    </div>
                                `,
                                    )
                                    .join("")}
                            </div>
                        `;
                    }
                }

                // Добавляем обработчики для редактирования и удаления
                if (isOwner && items.length > 0) {
                    if (type === "menu") {
                        additionalContent
                            .querySelectorAll(".edit-dish-btn")
                            .forEach((btn) => {
                                btn.onclick = () => {
                                    const dishId =
                                        btn.getAttribute("data-dish-id");
                                    const dish = items.find(
                                        (d) => d.id == dishId,
                                    );
                                    showEditDishModal(hotel, dish);
                                };
                            });

                        additionalContent
                            .querySelectorAll(".delete-dish-btn")
                            .forEach((btn) => {
                                btn.onclick = async () => {
                                    const dishId =
                                        btn.getAttribute("data-dish-id");
                                    if (
                                        confirm(
                                            "Вы уверены, что хотите удалить блюдо?",
                                        )
                                    ) {
                                        try {
                                            await API.deleteDish(dishId);
                                            Toast.success("Блюдо удалено");
                                            const menuBtn =
                                                hotelDetailSection.querySelector(
                                                    '.additional-btn[data-type="menu"]',
                                                );
                                            menuBtn?.click();
                                        } catch (err) {
                                            Toast.error(
                                                "Ошибка при удалении блюда",
                                            );
                                        }
                                    }
                                };
                            });
                    } else if (type === "services") {
                        additionalContent
                            .querySelectorAll(".edit-service-btn")
                            .forEach((btn) => {
                                btn.onclick = () => {
                                    const serviceId =
                                        btn.getAttribute("data-service-id");
                                    const service = items.find(
                                        (s) => s.id == serviceId,
                                    );
                                    showEditServiceModal(hotel, service);
                                };
                            });

                        additionalContent
                            .querySelectorAll(".delete-service-btn")
                            .forEach((btn) => {
                                btn.onclick = async () => {
                                    const serviceId =
                                        btn.getAttribute("data-service-id");
                                    if (
                                        confirm(
                                            "Вы уверены, что хотите удалить услугу?",
                                        )
                                    ) {
                                        try {
                                            await API.deleteService(serviceId);
                                            Toast.success("Услуга удалена");
                                            const servicesBtn =
                                                hotelDetailSection.querySelector(
                                                    '.additional-btn[data-type="services"]',
                                                );
                                            servicesBtn?.click();
                                        } catch (err) {
                                            Toast.error(
                                                "Ошибка при удалении услуги",
                                            );
                                        }
                                    }
                                };
                            });
                    }
                }
            } catch (err) {
                console.error("Ошибка загрузки:", err);
                additionalContent.innerHTML = `
                    <h3>${type === "menu" ? "Меню" : "Услуги"}</h3>
                    <p style="color: #999;">Ошибка загрузки</p>
                `;
            }
        };
    });

    // Обработчики для добавления меню/услуг (для владельца)
    if (isOwner) {
        const addMenuBtn = hotelDetailSection.querySelector(".add-menu-btn");
        const addServiceBtn =
            hotelDetailSection.querySelector(".add-service-btn");

        if (addMenuBtn) {
            addMenuBtn.onclick = () => {
                showModal(`
                    <h2>Добавить блюдо</h2>
                    <input type="text" class="dish-title" placeholder="Название блюда">
                    <textarea class="dish-composition" placeholder="Состав блюда..." rows="3"></textarea>
                    <label>Вес (г): <input type="number" class="dish-weight" min="1"></label>
                    <label>Цена (₽): <input type="number" class="dish-price" min="0"></label>
                    <label>Фото: <input type="file" class="dish-image" accept="image/*"></label>
                    <button class="btn save-dish-btn">Сохранить</button>
                    <button class="btn close-modal">Отмена</button>
                `);
                modal.querySelector(".close-modal").onclick = hideModal;
                modal.querySelector(".save-dish-btn").onclick = async () => {
                    const title = modal
                        .querySelector(".dish-title")
                        .value.trim();
                    const composition = modal
                        .querySelector(".dish-composition")
                        .value.trim();
                    const weight = modal
                        .querySelector(".dish-weight")
                        .value.trim();
                    const price = modal
                        .querySelector(".dish-price")
                        .value.trim();
                    const imageFile =
                        modal.querySelector(".dish-image").files[0];

                    if (
                        !title ||
                        !composition ||
                        !weight ||
                        !price ||
                        !imageFile
                    ) {
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
                        await API.postForm(
                            `hotels/${hotel.id}/dish/`,
                            formData,
                        );
                        Toast.success("Блюдо добавлено");
                        hideModal();
                        // Обновляем страницу отеля без добавления в историю
                        await renderHotelDetail(hotel, true);
                        // Автоматически открываем вкладку меню
                        const menuBtn = hotelDetailSection.querySelector(
                            '.additional-btn[data-type="menu"]',
                        );
                        menuBtn?.click();
                    } catch (err) {
                        const msg =
                            typeof err === "object" ? JSON.stringify(err) : err;
                        Toast.error("Ошибка добавления блюда: " + msg);
                    }
                };
            };
        }

        if (addServiceBtn) {
            addServiceBtn.onclick = () => {
                showModal(`
                    <h2>Добавить услугу</h2>
                    <input type="text" class="service-title" placeholder="Название услуги">
                    <label>Цена (₽): <input type="number" class="service-price" min="0"></label>
                    <label>Длительность (мин): <input type="number" class="service-duration" min="1"></label>
                    <label>Фото: <input type="file" class="service-image" accept="image/*"></label>
                    <button class="btn save-service-btn">Сохранить</button>
                    <button class="btn close-modal">Отмена</button>
                `);
                modal.querySelector(".close-modal").onclick = hideModal;
                modal.querySelector(".save-service-btn").onclick = async () => {
                    const title = modal
                        .querySelector(".service-title")
                        .value.trim();
                    const price = modal
                        .querySelector(".service-price")
                        .value.trim();
                    const duration = modal
                        .querySelector(".service-duration")
                        .value.trim();
                    const imageFile =
                        modal.querySelector(".service-image").files[0];

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
                        await API.postForm(
                            `hotels/${hotel.id}/service/`,
                            formData,
                        );
                        Toast.success("Услуга добавлена");
                        hideModal();
                        const servicesBtn = hotelDetailSection.querySelector(
                            '.additional-btn[data-type="services"]',
                        );
                        servicesBtn?.click();
                    } catch (err) {
                        const msg =
                            typeof err === "object" ? JSON.stringify(err) : err;
                        Toast.error("Ошибка добавления услуги: " + msg);
                    }
                };
            };
        }
    }

    if (isOwner) {
        hotelDetailSection.querySelector(".add-room-btn").onclick = () =>
            showCreateRoomModal(hotel);
    }
    try {
        const res = await API.getRooms(hotel.id);
        const rooms = res.data || res;
        const list = hotelDetailSection.querySelector(".rooms-list");
        if (!rooms.length) {
            list.textContent = "Нет номеров";
            return;
        }
        
        // Создаем контейнер для первого номера и карточки владельца
        list.innerHTML = '';
        
        rooms.forEach((r, index) => {
            const roomCard = `
            <div class="room-card-detail" data-room-id='${r.id}'>
                <div class="room-card-left">
                    <div class="room-card-img" style="background-image:url('${r.room_images ? r.room_images.replace("http://localhost", "") : "https://source.unsplash.com/250x200/?room"}')"></div>
                </div>
                <div class="room-card-middle">
                    <div class="room-category">${r.type === "standard" ? "🏠 Стандартный" : "👑 Люкс"}</div>
                    <div class="room-specs">
                        <p class="room-spec-item">👥 Мест: <b>${r.max_place || "—"}</b></p>
                        <p class="room-spec-item">📏 Площадь: <b>${r.square || "—"} м²</b></p>
                    </div>
                </div>
                <div class="room-card-right">
                    <div class="room-price-section">
                        <p class="room-price"><b>${r.price_on_one_day} ₽</b></p>
                        <p class="room-price-label">за ночь</p>
                    </div>
                    ${isOwner ? `<div class="room-card-actions"><button class='btn-small edit-room-btn' data-room-id='${r.id}'>✏️ Редактировать</button><button class='btn-small delete-room-btn' data-room-id='${r.id}' style="background:#dc3545;">🗑️ Удалить</button></div>` : `<button class='btn book-btn-small' data-room-id='${r.id}'>Забронировать</button>`}
                </div>
            </div>
        `;
            
            // Для первого номера - добавляем контейнер с владельцем
            if (index === 0) {
                const wrapper = document.createElement('div');
                wrapper.className = 'rooms-first-wrapper';
                wrapper.innerHTML = roomCard;
                
                // Добавляем карточку владельца
                const ownerCard = document.createElement('div');
                ownerCard.className = 'owner-card-standalone';
                ownerCard.innerHTML = `
                    <div class="owner-avatar">${hotel.owner_full_name ? hotel.owner_full_name.charAt(0).toUpperCase() : "?"}</div>
                    <div class="owner-details">
                        <div class="owner-name">${hotel.owner_full_name || "Владелец"}</div>
                        ${hotel.owner_phone ? `<div class="owner-contact">📱</div><div class="owner-contact-text">${hotel.owner_phone}</div>` : ""}
                        ${hotel.owner_email ? `<div class="owner-contact">📧</div><div class="owner-contact-text">${hotel.owner_email}</div>` : ""}
                    </div>
                `;
                
                wrapper.appendChild(ownerCard);
                list.appendChild(wrapper);
            } else {
                list.insertAdjacentHTML('beforeend', roomCard);
            }
        });

        // Обработчики для открытия детального просмотра номера
        list.querySelectorAll(".room-card-detail").forEach((card) => {
            card.onclick = (e) => {
                if (e.target.closest('.edit-room-btn') || e.target.closest('.delete-room-btn') || e.target.closest('.book-btn-small')) {
                    return;
                }
                const roomId = card.getAttribute("data-room-id");
                const room = rooms.find((r) => r.id === roomId);
                showRoomDetailModal(room, hotel, isOwner);
            };
        });

        // Обработчики для редактирования и удаления номеров (для владельца)
        if (isOwner) {
            list.querySelectorAll(".edit-room-btn").forEach((btn) => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    const roomId = btn.getAttribute("data-room-id");
                    const room = rooms.find((r) => r.id === roomId);
                    showEditRoomModal(hotel, room);
                };
            });

            list.querySelectorAll(".delete-room-btn").forEach((btn) => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    const roomId = btn.getAttribute("data-room-id");
                    showDeleteRoomConfirm(hotel, roomId);
                };
            });
        } else {
            // Обработчики для бронирования (для всех остальных)
            list.querySelectorAll(".book-btn-small").forEach((btn) => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    if (!user) {
                        Toast.warning("Необходимо зарегистрироваться, чтобы забронировать");
                        return;
                    }
                    const roomId = btn.getAttribute("data-room-id");
                    const room = rooms.find((r) => r.id === roomId);
                    showBookingModalForRoom(room, hotel);
                };
            });
        }
    } catch {
        hotelDetailSection.querySelector(".rooms-list").textContent =
            "Ошибка загрузки номеров";
    }

    // Загрузка отзывов
    loadReviews(hotel);
}

async function loadReviews(hotel) {
    const reviewsList = hotelDetailSection.querySelector(".reviews-list");
    const user = getUser();
    const isOwner =
        user &&
        (user.roles === "Admin" ||
            (user.roles === "Owner" && user.id === hotel.owner));

    try {
        const response = await API.getReviews(hotel.id);
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
                            <b class="comment-author">${review.user_name}</b>
                            <span class="comment-score">⭐ ${review.score}/5</span>
                        </div>
                        <span class="comment-date">${new Date(review.created_at).toLocaleDateString("ru-RU")}</span>
                    </div>
                    <p class="comment-text">${review.comment_text}</p>
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
                            await API.createReview(
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
                        await API.deleteReview(hotel.id, reviewId);
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

function showEditReviewModal(hotel, review) {
    showModal(`
        <h2>Редактировать отзыв</h2>
        <textarea class="edit-comment-input" rows="4">${review.comment_text}</textarea>
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
            await API.updateReview(
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

function showRoomDetailModal(room, hotel, isOwner) {
    const user = getUser();
    showModal(`
        <div class="room-detail-modal">
            <div class="room-detail-modal-image" style="background-image:url('${room.room_images ? room.room_images.replace("http://localhost", "") : "https://source.unsplash.com/600x300/?room"}')"></div>
            <h2 style="text-align: center; margin-bottom: 16px;">${room.title || (room.type === "standard" ? "Стандартный номер" : "Люкс номер")}</h2>
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
                <p>${room.description || "Описание отсутствует"}</p>
            </div>
            <div class="room-detail-modal-price">${room.price_on_one_day} ₽ за сутки</div>
            <div class="room-detail-modal-actions">
                ${isOwner ? `
                    <button class="btn edit-room-detail-btn" style="background: #667eea;">✏️ Редактировать</button>
                    <button class="btn delete-room-detail-btn" style="background: #dc3545;">🗑️ Удалить</button>
                ` : `
                    <button class="btn book-room-detail-btn">Забронировать</button>
                `}
                <button class="btn close-room-detail-btn" style="background: #6c757d;">Закрыть</button>
            </div>
        </div>
    `);
    
    modal.querySelector(".close-room-detail-btn").onclick = hideModal;
    
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

function showDeleteRoomConfirm(hotel, roomId) {
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
            await API.delete(`rooms/`, roomId);
            hideModal();
            Toast.success("Номер удален");
            await renderHotelDetail(hotel, true);
        } catch (err) {
            Toast.error("Ошибка при удалении номера");
        }
    };
}

function showBookingModalForRoom(room, hotel) {
    showModal(`
        <h2>Бронирование: ${hotel.title}</h2>
        <p><b>Номер:</b> ${room.type === "standard" ? "Стандартный" : "Люкс"} — ${room.price_on_one_day} руб/день</p>
        <label>Дата заезда: <input type="date" class="date-from"></label><br>
        <label>Дата выезда: <input type="date" class="date-to"></label><br>
        <button class="btn confirm-booking">Забронировать</button>
        <button class="btn close-modal">Отмена</button>
    `);
    modal.querySelector(".close-modal").onclick = hideModal;
    modal.querySelector(".confirm-booking").onclick = async () => {
        const check_in = modal.querySelector(".date-from").value;
        const check_out = modal.querySelector(".date-to").value;
        if (!check_in || !check_out) {
            Toast.warning("Заполните даты");
            return;
        }
        try {
            await API.createBooking(room.id, check_in, check_out);
            hideModal();
            Toast.success("Бронирование успешно!");
        } catch (err) {
            Toast.error(
                "Ошибка бронирования. Возможно, номер уже забронирован",
            );
        }
    };
}

function showEditRoomModal(hotel, room) {
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
                for (let file of imageFiles) {
                    formData.append("room_images", file);
                }
                await API.postForm(`rooms/${room.id}/`, formData);
            } else {
                await API.patch(`rooms/`, room.id, {
                    title: title,
                    type: type,
                    price_on_one_day: parseInt(price),
                    max_place: parseInt(max_place),
                    square: parseInt(square),
                    description: description
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

function showCreateRoomModal(hotel) {
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
        const imageFile = modal.querySelector(".room-image").files[0];
        if (!price || !max_place || !square || !description || !imageFile) {
            Toast.warning("Заполните все поля и выберите фото");
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
        formData.append("room_images", imageFile);
        try {
            await API.createRoom(hotel.id, formData);
            hideModal();
            Toast.success("Номер успешно добавлен!");
            // Перезагружаем только список номеров
            try {
                const res = await API.getRooms(hotel.id);
                const rooms = res.data || res;
                const list = hotelDetailSection.querySelector(".rooms-list");
                if (!rooms.length) {
                    list.textContent = "Нет номеров";
                    return;
                }
                const user = getUser();
                
                list.innerHTML = '';
                rooms.forEach((r, index) => {
                    const roomCard = `
                    <div class="room-card-detail" data-room-id='${r.id}'>
                        <div class="room-card-left">
                            <div class="room-card-img" style="background-image:url('${r.room_images ? r.room_images.replace("http://localhost", "") : "https://source.unsplash.com/250x200/?room"}')"></div>
                        </div>
                        <div class="room-card-middle">
                            <div class="room-category">${r.type === "standard" ? "🏠 Стандартный" : "👑 Люкс"}</div>
                            <div class="room-specs">
                                <p class="room-spec-item">👥 Мест: <b>${r.max_place || "—"}</b></p>
                                <p class="room-spec-item">📏 Площадь: <b>${r.square || "—"} м²</b></p>
                            </div>
                        </div>
                        <div class="room-card-right">
                            <div class="room-price-section">
                                <p class="room-price"><b>${r.price_on_one_day} ₽</b></p>
                                <p class="room-price-label">за ночь</p>
                            </div>
                            ${isOwner ? `<div class="room-card-actions"><button class='btn-small edit-room-btn' data-room-id='${r.id}'>✏️ Редактировать</button><button class='btn-small delete-room-btn' data-room-id='${r.id}' style="background:#dc3545;">🗑️ Удалить</button></div>` : `<button class='btn book-btn-small' data-room-id='${r.id}'>Забронировать</button>`}
                        </div>
                    </div>
                `;
                    
                    // Для первого номера - добавляем контейнер с владельцем
                    if (index === 0) {
                        const wrapper = document.createElement('div');
                        wrapper.className = 'rooms-first-wrapper';
                        wrapper.innerHTML = roomCard;
                        
                        // Добавляем карточку владельца
                        const ownerCard = document.createElement('div');
                        ownerCard.className = 'owner-card-standalone';
                        ownerCard.innerHTML = `
                            <div class="owner-avatar">${hotel.owner_full_name ? hotel.owner_full_name.charAt(0).toUpperCase() : "?"}</div>
                            <div class="owner-details">
                                <div class="owner-name">${hotel.owner_full_name || "Владелец"}</div>
                                ${hotel.owner_phone ? `<div class="owner-contact">📱</div><div class="owner-contact-text">${hotel.owner_phone}</div>` : ""}
                                ${hotel.owner_email ? `<div class="owner-contact">📧</div><div class="owner-contact-text">${hotel.owner_email}</div>` : ""}
                            </div>
                        `;
                        
                        wrapper.appendChild(ownerCard);
                        list.appendChild(wrapper);
                    } else {
                        list.insertAdjacentHTML('beforeend', roomCard);
                    }
                });
                
                // Обработчики для открытия детального просмотра номера
                list.querySelectorAll(".room-card-detail").forEach((card) => {
                    card.onclick = (e) => {
                        if (e.target.closest('.edit-room-btn') || e.target.closest('.delete-room-btn') || e.target.closest('.book-btn-small')) {
                            return;
                        }
                        const roomId = card.getAttribute("data-room-id");
                        const room = rooms.find((r) => r.id === roomId);
                        showRoomDetailModal(room, hotel, isOwner);
                    };
                });
                
                // Обработчики для редактирования и удаления номеров (для владельца)
                if (isOwner) {
                    list.querySelectorAll(".edit-room-btn").forEach((btn) => {
                        btn.onclick = () => {
                            const roomId = btn.getAttribute("data-room-id");
                            const room = rooms.find((r) => r.id === roomId);
                            showEditRoomModal(hotel, room);
                        };
                    });
                    
                    list.querySelectorAll(".delete-room-btn").forEach((btn) => {
                        btn.onclick = async () => {
                            const roomId = btn.getAttribute("data-room-id");
                            if (confirm("Вы уверены, что хотите удалить номер?")) {
                                try {
                                    await API.delete(`rooms/`, roomId);
                                    Toast.success("Номер удален");
                                    await renderHotelDetail(hotel, true);
                                } catch (err) {
                                    Toast.error("Ошибка при удалении номера");
                                }
                            }
                        };
                    });
                } else {
                    // Обработчики для бронирования (для всех остальных)
                    list.querySelectorAll(".book-btn-small").forEach((btn) => {
                        btn.onclick = () => {
                            if (!user) {
                                Toast.warning("Необходимо зарегистрироваться, чтобы забронировать");
                                return;
                            }
                            const roomId = btn.getAttribute("data-room-id");
                            const room = rooms.find((r) => r.id === roomId);
                            showBookingModalForRoom(room, hotel);
                        };
                    });
                }
            } catch {
                hotelDetailSection.querySelector(".rooms-list").textContent =
                    "Ошибка загрузки номеров";
            }
        } catch (err) {
            const msg = typeof err === "object" ? JSON.stringify(err) : err;
            Toast.error("Ошибка создания номера");
        }
    };
}

async function showBookingModal(hotel) {
    showModal(
        `<h2>Бронирование: ${hotel.title}</h2><div class="rooms-list">Загрузка номеров...</div>`,
    );
    let rooms = [];
    try {
        const res = await API.getRooms(hotel.id);
        rooms = res.data || res;
    } catch {
        modal.querySelector(".rooms-list").textContent =
            "Ошибка загрузки номеров";
        return;
    }
    if (!rooms.length) {
        modal.querySelector(".rooms-list").textContent =
            "Нет доступных номеров";
        return;
    }
    const roomOptions = rooms
        .map(
            (r) =>
                `<option value="${r.id}">${r.type} — ${r.price_on_one_day} руб/день</option>`,
        )
        .join("");
    modal.querySelector(".rooms-list").innerHTML = `
        <label>Номер: <select class="room-select">${roomOptions}</select></label><br>
        <label>Дата заезда: <input type="date" class="date-from"></label><br>
        <label>Дата выезда: <input type="date" class="date-to"></label><br>
        <button class="btn confirm-booking">Забронировать</button>
        <button class="btn close-modal">Отмена</button>
    `;
    modal.querySelector(".close-modal").onclick = hideModal;
    modal.querySelector(".confirm-booking").onclick = async () => {
        const roomId = modal.querySelector(".room-select").value;
        const check_in = modal.querySelector(".date-from").value;
        const check_out = modal.querySelector(".date-to").value;
        if (!check_in || !check_out) {
            Toast.warning("Заполните даты");
            return;
        }
        try {
            await API.createBooking(roomId, check_in, check_out);
            hideModal();
            Toast.success("Бронирование успешно!");
        } catch (err) {
            Toast.error(
                "Ошибка бронирования. Возможно, номер уже забронирован",
            );
        }
    };
}

function showEditHotelPage(hotel) {
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
                await API.postForm(`hotels/${hotel.id}/`, formData);
            } else {
                await API.patch("hotels/", hotel.id, {
                    title,
                    city,
                    address,
                    description
                });
            }
            Toast.success("Гостиница успешно обновлена!");
            const updatedHotel = { ...hotel, title, city, address, description };
            renderHotelDetail(updatedHotel);
        } catch (err) {
            Toast.error("Ошибка при обновлении гостиницы");
        }
    };
}

function showDeleteHotelConfirm(hotel) {
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
            await API.delete("hotels/", hotel.id);
            hideModal();
            Toast.success("Гостиница успешно удалена");
            hideAllSections();
            renderHotels();
        } catch (err) {
            Toast.error("Ошибка при удалении гостиницы");
        }
    };
}

function showCreateHotelModal() {
    showModal(`
        <h2>Добавить жильё</h2>
        <label>Название: <input type="text" class="hotel-title"></label>
        <label>Описание: <input type="text" class="hotel-description"></label>
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
            await API.postForm("hotels/", formData);
            hideModal();
            Toast.success("Жильё успешно добавлено!");
            renderHotels();
        } catch (err) {
            const msg = typeof err === "object" ? JSON.stringify(err) : err;
            Toast.error("Ошибка создания отеля");
        }
    };
}

function showEditDishModal(hotel, dish) {
    showModal(`
        <h2>Редактировать блюдо</h2>
        <input type="text" class="edit-dish-title" value="${dish.title}" placeholder="Название блюда">
        <textarea class="edit-dish-composition" rows="3">${dish.composition}</textarea>
        <label>Вес (г): <input type="number" class="edit-dish-weight" value="${dish.weight}" min="1"></label>
        <label>Цена (₽): <input type="number" class="edit-dish-price" value="${dish.price}" min="0"></label>
        ${dish.dish_images ? `<img src="${dish.dish_images}" class="dish-image-preview" alt="Текущее фото">` : ""}
        <label>Новое фото: <input type="file" class="edit-dish-image" accept="image/*"></label>
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

        const data = {
            title,
            composition,
            weight,
            price,
        };

        try {
            if (imageFile) {
                const formData = new FormData();
                formData.append("title", title);
                formData.append("composition", composition);
                formData.append("weight", weight);
                formData.append("price", price);
                formData.append("dish_images", imageFile);
                await API.postForm(`dishes/${dish.id}/`, formData);
            } else {
                await API.updateDish(dish.id, data);
            }
            Toast.success("Блюдо обновлено");
            hideModal();
            const menuBtn = hotelDetailSection.querySelector(
                '.additional-btn[data-type="menu"]',
            );
            menuBtn?.click();
        } catch (err) {
            const msg = typeof err === "object" ? JSON.stringify(err) : err;
            Toast.error("Ошибка обновления блюда: " + msg);
        }
    };
}

function showEditServiceModal(hotel, service) {
    showModal(`
        <h2>Редактировать услугу</h2>
        <input type="text" class="edit-service-title" value="${service.title}" placeholder="Название услуги">
        <label>Цена (₽): <input type="number" class="edit-service-price" value="${service.price}" min="0"></label>
        <label>Длительность (мин): <input type="number" class="edit-service-duration" value="${service.duration}" min="1"></label>
        ${service.service_images ? `<img src="${service.service_images}" class="service-image-preview" alt="Текущее фото">` : ""}
        <label>Новое фото: <input type="file" class="edit-service-image" accept="image/*"></label>
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

        const data = {
            title,
            price,
            duration,
        };

        try {
            if (imageFile) {
                const formData = new FormData();
                formData.append("title", title);
                formData.append("price", price);
                formData.append("duration", duration);
                formData.append("service_images", imageFile);
                await API.postForm(`services/${service.id}/`, formData);
            } else {
                await API.updateService(service.id, data);
            }
            Toast.success("Услуга обновлена");
            hideModal();
            const servicesBtn = hotelDetailSection.querySelector(
                '.additional-btn[data-type="services"]',
            );
            servicesBtn?.click();
        } catch (err) {
            const msg = typeof err === "object" ? JSON.stringify(err) : err;
            Toast.error("Ошибка обновления услуги: " + msg);
        }
    };
}

// --- Навигация ---
const siteTitle = document.querySelector(".site-title");
siteTitle.style.cursor = "pointer";
siteTitle.onclick = () => {
    hideAllSections();
    renderHotels();
};

btnLogin.onclick = renderAuthForm;
btnProfile.onclick = renderProfile;
btnBookings.onclick = renderBookings;
btnCreateHotel.onclick = showCreateHotelModal;
modal.onclick = (e) => {
    if (e.target === modal) {
        hideModal();
    }
};

window.setHeaderAuth = setHeaderAuth;
setHeaderAuth(!!getUser());

// Обработчик кнопок назад/вперед браузера
window.addEventListener("popstate", async (event) => {
    // Если модальное окно открыто, закрываем его
    if (modal.style.display === "flex") {
        modal.style.display = "none";
        return;
    }

    if (event.state) {
        const { page, hotelId } = event.state;

        switch (page) {
            case "hotels":
                hideAllSections();
                hotelsList.innerHTML = "Загрузка...";
                try {
                    const hotels = await API.getHotels();
                    hotelsList.innerHTML = "";
                    hotels.forEach((hotel) => {
                        const card = document.createElement("div");
                        card.className = "hotel-card";
                        card.innerHTML = `
                            <div class="hotel-img" style="background-image:url('${hotel.hostel_images ? hotel.hostel_images.replace("http://localhost", "") : "https://source.unsplash.com/400x200/?hotel"}')"></div>
                            <div class="hotel-info">
                                <h2>${hotel.title}</h2>
                                <p><b>Город:</b> ${hotel.city || "—"}</p>
                                <p><b>Адрес:</b> ${hotel.address || "—"}</p>
                                <button class="btn detail-btn">Подробнее</button>
                            </div>
                        `;
                        card.querySelector(".detail-btn").onclick = () =>
                            renderHotelDetail(hotel);
                        hotelsList.append(card);
                    });
                } catch {
                    hotelsList.innerHTML = "Ошибка загрузки гостиниц";
                }
                break;
            case "profile":
                await renderProfile(true);
                break;
            case "bookings":
                await renderBookings(true);
                break;
            case "login":
                renderAuthForm(true);
                break;
            case "register":
                renderRegisterForm(true);
                break;
            case "hotel":
                if (hotelId) {
                    const hotels = await API.getHotels();
                    const hotel = hotels.find((h) => h.id === hotelId);
                    if (hotel) {
                        await renderHotelDetail(hotel, true);
                    } else {
                        hideAllSections();
                        await renderHotels(true);
                    }
                }
                break;
            default:
                hideAllSections();
                await renderHotels(true);
        }
    } else {
        hideAllSections();
        await renderHotels(true);
    }
});

// Обработчик клавиши Escape для закрытия модального окна
window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.style.display === "flex") {
        hideModal();
    }
});

// Инициализация - заменяем текущее состояние
window.history.replaceState({ page: "hotels" }, "", "#hotels");
renderHotels(true);
