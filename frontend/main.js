import API from "./api.js";

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
    hotelsSection.style.display = (section === hotelDetailSection || section === authSection || section === profileSection || section === bookingsSection) ? "none" : "block";
    section.style.display = "block";
}
function hideAllSections() {
    [authSection, profileSection, bookingsSection, hotelDetailSection].forEach(
        (s) => (s.style.display = "none"),
    );
    document.querySelector(".hotels-section").style.display = "block";
}
function showModal(html) {
    modal.innerHTML = `<div class="modal-content">${html}</div>`;
    modal.style.display = "flex";
}
function hideModal() {
    modal.style.display = "none";
}

function setHeaderAuth(isAuth) {
    btnLogin.style.display = isAuth ? "none" : "inline-block";
    btnProfile.style.display = isAuth ? "inline-block" : "none";
    btnBookings.style.display = isAuth ? "inline-block" : "none";
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const canCreate = isAuth && user && (user.roles === "Admin" || user.roles === "Owner");
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
function renderAuthForm() {
    showSection(authSection);
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
        try {
            const data = await API.login(email, password);
            setUser(data.user, data.token);
            setHeaderAuth(true);
            hideAllSections();
            renderHotels();
        } catch {
            alert("Ошибка входа");
        }
    };
    authSection.querySelector(".to-register").onclick = (e) => {
        e.preventDefault();
        renderRegisterForm();
    };
}
function renderRegisterForm() {
    showSection(authSection);
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
        } catch (err) {
            alert("Ошибка регистрации");
        }
    };
    authSection.querySelector(".to-login").onclick = (e) => {
        e.preventDefault();
        renderAuthForm();
    };
}

// --- Профиль ---
async function renderProfile() {
    showSection(profileSection);
    profileSection.innerHTML =
        "<div class='profile-form'><h2>Профиль</h2><div class='profile-info'>Загрузка...</div><button class='btn logout-btn'>Выйти</button></div>";
    try {
        const user = await API.getProfile();
        profileSection.querySelector(".profile-info").innerHTML = `
            <b>Имя:</b> ${user.full_name}<br>
            <b>Email:</b> ${user.email || "—"}
        `;
    } catch {
        profileSection.querySelector(".profile-info").innerHTML =
            "Ошибка загрузки профиля";
    }
    profileSection.querySelector(".logout-btn").onclick = logout;
}

// --- Бронирования ---
async function renderBookings() {
    showSection(bookingsSection);
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
async function renderHotels() {
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
            card.querySelector(".detail-btn").onclick = () => renderHotelDetail(hotel);
            hotelsList.append(card);
        });
    } catch {
        hotelsList.innerHTML = "Ошибка загрузки гостиниц";
    }
}

async function renderHotelDetail(hotel) {
    showSection(hotelDetailSection);
    const user = getUser();
    const isOwner = user && (user.roles === "Admin" || (user.roles === "Owner" && user.id === hotel.owner));
    hotelDetailSection.innerHTML = `
        <div class="hotel-detail">
            <button class="btn back-btn">← Назад</button>
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
    if (isOwner) {
        hotelDetailSection.querySelector(".add-room-btn").onclick = () => showCreateRoomModal(hotel);
    }
    try {
        const res = await API.getRooms(hotel.id);
        const rooms = res.data || res;
        const list = hotelDetailSection.querySelector(".rooms-list");
        if (!rooms.length) { list.textContent = "Нет номеров"; return; }
        list.innerHTML = rooms.map(r => `
            <div class="room-card-detail">
                <div class="room-card-img" style="background-image:url('${r.room_images ? r.room_images.replace("http://localhost", "") : "https://source.unsplash.com/300x200/?room"}')"></div>
                <div class="room-card-content">
                    <h3>${r.type === "standard" ? "Стандартный" : "Люкс"}</h3>
                    <p class="room-card-info">Количество мест: <b>${r.max_place || "—"}</b></p>
                    <p class="room-card-info">Площадь: <b>${r.square || "—"} м²</b></p>
                    <p class="room-card-price"><b>${r.price_on_one_day} руб</b> / день</p>
                    ${user ? `<button class='btn book-btn-small' data-room-id='${r.id}'>Забронировать</button>` : ""}
                </div>
            </div>
        `).join("");
        if (user) {
            list.querySelectorAll(".book-btn-small").forEach(btn => {
                btn.onclick = () => {
                    const roomId = btn.getAttribute("data-room-id");
                    const room = rooms.find(r => r.id === roomId);
                    showBookingModalForRoom(room, hotel);
                };
            });
        }
    } catch {
        hotelDetailSection.querySelector(".rooms-list").textContent = "Ошибка загрузки номеров";
    }
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
        if (!check_in || !check_out) { alert("Заполните даты"); return; }
        try {
            await API.createBooking(room.id, check_in, check_out);
            hideModal();
            alert("Бронирование успешно!");
        } catch {
            alert("Ошибка бронирования");
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
        <label>Фото: <input type="file" class="room-image" accept="image/*"></label>
        <button class="btn confirm-create-room">Создать</button>
        <button class="btn close-modal">Отмена</button>
    `);
    modal.querySelector(".close-modal").onclick = hideModal;
    modal.querySelector(".confirm-create-room").onclick = async () => {
        const type = modal.querySelector(".room-type").value;
        const price = modal.querySelector(".room-price").value.trim();
        const max_place = modal.querySelector(".room-max-place").value.trim();
        const square = modal.querySelector(".room-square").value.trim();
        const description = modal.querySelector(".room-description").value.trim();
        const imageFile = modal.querySelector(".room-image").files[0];
        if (!price || !max_place || !square || !description || !imageFile) {
            alert("Заполните все поля и выберите фото");
            return;
        }
        const formData = new FormData();
        formData.append("title", type === "standard" ? "Стандартный номер" : "Люкс номер");
        formData.append("type", type);
        formData.append("price_on_one_day", price);
        formData.append("max_place", max_place);
        formData.append("square", square);
        formData.append("description", description);
        formData.append("room_images", imageFile);
        try {
            await API.createRoom(hotel.id, formData);
            hideModal();
            alert("Номер успешно добавлен!");
            renderHotelDetail(hotel);
        } catch (err) {
            const msg = typeof err === "object" ? JSON.stringify(err) : err;
            alert("Ошибка создания номера: " + msg);
        }
    };
}

async function showBookingModal(hotel) {
    showModal(`<h2>Бронирование: ${hotel.title}</h2><div class="rooms-list">Загрузка номеров...</div>`);
    let rooms = [];
    try {
        const res = await API.getRooms(hotel.id);
        rooms = res.data || res;
    } catch {
        modal.querySelector(".rooms-list").textContent = "Ошибка загрузки номеров";
        return;
    }
    if (!rooms.length) {
        modal.querySelector(".rooms-list").textContent = "Нет доступных номеров";
        return;
    }
    const roomOptions = rooms.map(r => `<option value="${r.id}">${r.type} — ${r.price_on_one_day} руб/день</option>`).join("");
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
        if (!check_in || !check_out) { alert("Заполните даты"); return; }
        try {
            await API.createBooking(roomId, check_in, check_out);
            hideModal();
            alert("Бронирование успешно!");
        } catch {
            alert("Ошибка бронирования");
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
        <label>Фото: <input type="file" class="hotel-image" accept="image/*"></label>
        <button class="btn confirm-create-hotel">Создать</button>
        <button class="btn close-modal">Отмена</button>
    `);
    modal.querySelector(".close-modal").onclick = hideModal;
    modal.querySelector(".confirm-create-hotel").onclick = async () => {
        const title = modal.querySelector(".hotel-title").value.trim();
        const description = modal.querySelector(".hotel-description").value.trim();
        const address = modal.querySelector(".hotel-address").value.trim();
        const city = modal.querySelector(".hotel-city").value.trim();
        const imageFile = modal.querySelector(".hotel-image").files[0];
        if (!title || !description || !address || !imageFile) {
            alert("Заполните все поля и выберите фото");
            return;
        }
        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("address", address);
        formData.append("city", city);
        formData.append("hostel_images", imageFile);
        try {
            await API.postForm("hotels/", formData);
            hideModal();
            alert("Жильё успешно добавлено!");
            renderHotels();
        } catch (err) {
            const msg = typeof err === "object" ? JSON.stringify(err) : err;
            alert("Ошибка создания: " + msg);
        }
    };
}

// --- Навигация ---
btnLogin.onclick = renderAuthForm;
btnProfile.onclick = renderProfile;
btnBookings.onclick = renderBookings;
btnCreateHotel.onclick = showCreateHotelModal;
modal.onclick = (e) => {
    if (e.target === modal) hideModal();
};

window.setHeaderAuth = setHeaderAuth;
setHeaderAuth(!!getUser());
renderHotels();
