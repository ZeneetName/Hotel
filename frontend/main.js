/* global AuthApi, HotelApi, RoomApi, BookingApi, ReviewApi, getToken, setToken, getUserId, setUserId, mediaUrl, API */

const ROLE_LABEL = {
    Default_user: "Пользователь",
    Owner: "Владелец",
    Admin: "Директор",
};

const ROOM_TYPE_LABEL = {
    standard: "Стандартный номер",
    deluxe: "Люксовый номер",
};

let state = {
    route: "hotels",
    hotelId: null,
    profile: null,
    hotels: [],
    roomsCache: {},
    search: {
        city: "",
        check_in: "",
        check_out: "",
    },
};

function showToast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
        el.hidden = true;
    }, 3200);
}

function roleClass(role) {
    if (role === "Admin") return "badge-admin";
    if (role === "Owner") return "badge-owner";
    return "badge-buyer";
}

function initials(name) {
    if (!name) return "?";
    const p = String(name).trim().split(/\s+/);
    return (p[0][0] + (p[1]?.[0] || "")).toUpperCase();
}

async function loadProfile() {
    if (!getToken()) {
        state.profile = null;
        return null;
    }
    try {
        state.profile = await AuthApi.me();
        return state.profile;
    } catch {
        state.profile = null;
        return null;
    }
}

function updateAuthNav() {
    const btn = document.getElementById("nav-auth");
    if (!btn) return;
    btn.textContent = getToken() ? "Выйти" : "Вход";
}

function navigate(route, id = null) {
    state.route = route;
    state.hotelId = id;
    const h = id ? `${route}:${id}` : route;
    if (window.location.hash !== `#${h}`) window.location.hash = h;
    render();
}

function parseHash() {
    const raw = (window.location.hash || "#/hotels").replace(/^#/, "");
    const [route, id] = raw.split(":");
    const map = {
        hotels: "hotels",
        hotel: "hotel",
        auth: "auth",
        profile: "profile",
        bookings: "bookings",
    };
    state.route = map[route] || "hotels";
    state.hotelId = id || null;
}

async function ensureProfile() {
    if (!state.profile && getToken()) await loadProfile();
}

function isOwnerOrAdmin() {
    const r = state.profile && state.profile.roles;
    return r === "Owner" || r === "Admin";
}

function isAdmin() {
    return state.profile && state.profile.roles === "Admin";
}

function isDefaultUser() {
    return state.profile && state.profile.roles === "Default_user";
}

function canManageHotel(hotel) {
    if (!state.profile || !hotel) return false;
    if (state.profile.roles === "Admin") return true;
    const uid = getUserId();
    if (
        state.profile.roles === "Owner" &&
        uid &&
        String(hotel.owner) === String(uid)
    )
        return true;
    return false;
}

function nightsBetween(checkIn, checkOut) {
    const a = new Date(checkIn);
    const b = new Date(checkOut);
    const ms = b - a;
    return Math.max(0, Math.round(ms / 86400000));
}

function computeStayPrice(pricePerDay, checkIn, checkOut) {
    const n = nightsBetween(checkIn, checkOut);
    return n * Number(pricePerDay || 0);
}

function cleanupOverlays() {
    document.querySelectorAll("#hotel-form-modal").forEach((el) => el.remove());
    document.querySelectorAll(".modal-overlay.open").forEach((el) => {
        el.classList.remove("open");
        el.innerHTML = "";
        if (!el.id || el.id === "booking-modal-root") el.className = "";
    });
    document.querySelectorAll(".drawer-overlay.open").forEach((el) => {
        el.classList.remove("open");
    });
}

function render() {
    cleanupOverlays();
    updateAuthNav();
    const app = document.getElementById("app");
    if (!app) return;

    if (!getToken() && ["profile", "bookings"].includes(state.route)) {
        state.route = "auth";
    }

    if (state.route === "auth") {
        app.innerHTML = renderAuthPage();
        bindAuthPage();
        return;
    }
    if (state.route === "profile") {
        renderProfilePage(app);
        return;
    }
    if (state.route === "bookings") {
        renderBookingsPage(app);
        return;
    }
    if (state.route === "hotel" && state.hotelId) {
        renderHotelDetail(app);
        return;
    }
    renderHotelsList(app);
}

function renderAuthPage() {
    return `
    <div class="auth-wrap">
      <div class="auth-card">
        <div class="auth-tabs">
          <button type="button" data-tab="login" class="active">Вход</button>
          <button type="button" data-tab="register">Регистрация</button>
        </div>
        <form id="form-login" class="auth-form">
          <div class="field"><label>Email</label><input class="input-line" name="email" type="email" required autocomplete="username" /></div>
          <div class="field"><label>Пароль</label><input class="input-line" name="password" type="password" required autocomplete="current-password" /></div>
          <button class="btn btn-primary btn-block" type="submit">Войти</button>
        </form>
        <form id="form-register" class="auth-form hidden">
          <div class="field"><label>Email</label><input class="input-line" name="email" type="email" required /></div>
          <div class="field"><label>Полное имя</label><input class="input-line" name="full_name" required /></div>
          <div class="field"><label>Телефон (+7…)</label><input class="input-line" name="phone" placeholder="+79991234567" required /></div>
          <div class="field"><label>Пароль</label><input class="input-line" name="password" type="password" minlength="6" required /></div>
          <button class="btn btn-primary btn-block" type="submit">Зарегистрироваться</button>
        </form>
        <div class="api-hint">
          <strong>Адрес API</strong> — в Docker: <code>http://localhost</code> (nginx проксирует <code>/api</code>).
          Локально: <code>http://127.0.0.1:8000</code>.
          <div class="field field-compact">
            <input class="input-line" id="api-origin" type="url" placeholder="авто" value="${API.origin.replace(/"/g, "&quot;")}" autocomplete="off" />
          </div>
        </div>
      </div>
    </div>`;
}

function bindAuthPage() {
    const tabs = document.querySelectorAll(".auth-tabs button");
    const formLogin = document.getElementById("form-login");
    const formReg = document.getElementById("form-register");
    tabs.forEach((t) => {
        t.addEventListener("click", () => {
            tabs.forEach((x) => x.classList.remove("active"));
            t.classList.add("active");
            const tab = t.getAttribute("data-tab");
            formLogin.classList.toggle("hidden", tab !== "login");
            formReg.classList.toggle("hidden", tab !== "register");
        });
    });

    const apiOriginInput = document.getElementById("api-origin");
    const syncApiField = () => {
        API.origin = apiOriginInput.value;
        apiOriginInput.value = API.origin;
    };
    apiOriginInput.addEventListener("change", syncApiField);
    apiOriginInput.addEventListener("blur", syncApiField);

    formLogin.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(formLogin);
        try {
            const data = await AuthApi.login({
                email: fd.get("email"),
                password: fd.get("password"),
            });
            if (data && data.token) {
                setToken(data.token);
                setUserId(data.id);
                await loadProfile();
                showToast(data.detail || "Вход выполнен");
                navigate("hotels");
            } else {
                showToast(typeof data === "string" ? data : "Ошибка входа");
            }
        } catch (err) {
            showToast(err.message || "Ошибка");
        }
    });

    formReg.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(formReg);
        try {
            const data = await AuthApi.register({
                email: fd.get("email"),
                full_name: fd.get("full_name"),
                phone: fd.get("phone"),
                password: fd.get("password"),
            });
            showToast((data && data.detail) || "Регистрация ок");
            tabs[0].click();
        } catch (err) {
            showToast(err.message || "Ошибка регистрации");
        }
    });
}

async function renderProfilePage(app) {
    app.innerHTML = `<p class="text-muted">Загрузка…</p>`;
    await loadProfile();
    if (!state.profile) {
        navigate("auth");
        return;
    }
    const p = state.profile;
    app.innerHTML = `
    <div class="page-head">
      <h1 class="page-title">Профиль</h1>
      <p class="page-sub">Данные аккаунта и роль в системе.</p>
    </div>
    <div class="profile-layout">
      <div class="avatar-block profile-sidebar glass">
        <div class="avatar">${initials(p.full_name)}</div>
        <div class="profile-name">${escapeHtml(p.full_name)}</div>
        <span class="badge ${roleClass(p.roles)}">[${ROLE_LABEL[p.roles] || p.roles}]</span>
      </div>
      <div class="info-cards">
        <div class="mini-card" data-card="email">
          <header><span>Email</span><button type="button" class="linklike js-edit-card">Изменить</button></header>
          <div class="js-view">${escapeHtml(p.email)}</div>
          <div class="js-edit hidden"><p class="text-muted">На бэкенде нет PATCH для профиля — только просмотр.</p></div>
        </div>
        <div class="mini-card" data-card="phone">
          <header><span>Телефон</span><button type="button" class="linklike js-edit-card">Изменить</button></header>
          <div class="js-view">${escapeHtml(p.phone)}</div>
          <div class="js-edit hidden"><p class="text-muted">Сохранение не подключено к API.</p></div>
        </div>
      </div>
    </div>`;

    app.querySelectorAll(".js-edit-card").forEach((btn) => {
        btn.addEventListener("click", () => {
            const card = btn.closest(".mini-card");
            card.querySelector(".js-view").classList.toggle("hidden");
            card.querySelector(".js-edit").classList.toggle("hidden");
        });
    });
}

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function todayIso() {
    return new Date().toISOString().slice(0, 10);
}

function renderHotelSearchBar() {
    const s = state.search;
    return `
    <form id="hotel-search-form" class="search-bar card">
      <div class="search-bar-grid">
        <div class="field">
          <label for="search-city">Город</label>
          <input class="input-line" id="search-city" name="city" type="text" placeholder="Например, Москва" value="${escapeHtml(s.city)}" />
        </div>
        <div class="field">
          <label for="search-check-in">Заезд</label>
          <input class="input-line" id="search-check-in" name="check_in" type="date" min="${todayIso()}" value="${escapeHtml(s.check_in)}" />
        </div>
        <div class="field">
          <label for="search-check-out">Выезд</label>
          <input class="input-line" id="search-check-out" name="check_out" type="date" min="${todayIso()}" value="${escapeHtml(s.check_out)}" />
        </div>
        <div class="search-bar-actions">
          <button type="submit" class="btn btn-primary">Найти</button>
          <button type="button" class="btn btn-quiet" id="search-reset">Сбросить</button>
        </div>
      </div>
      <p class="text-muted search-hint">Показываются отели со свободными номерами на выбранные даты.</p>
    </form>`;
}

function bindHotelSearchForm(app) {
    const form = document.getElementById("hotel-search-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const checkIn = fd.get("check_in");
        const checkOut = fd.get("check_out");
        if ((checkIn && !checkOut) || (!checkIn && checkOut)) {
            showToast("Укажите обе даты: заезд и выезд");
            return;
        }
        if (checkIn && checkOut && checkOut <= checkIn) {
            showToast("Дата выезда должна быть позже заезда");
            return;
        }
        state.search = {
            city: String(fd.get("city") || "").trim(),
            check_in: checkIn || "",
            check_out: checkOut || "",
        };
        await loadAndPaintHotels(app);
    });

    const resetBtn = document.getElementById("search-reset");
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            state.search = { city: "", check_in: "", check_out: "" };
            renderHotelsList(app);
        });
    }
}

function bindAddHotelButton(app) {
    const addHotelBtn = document.getElementById("btn-add-hotel");
    if (!addHotelBtn) return;
    addHotelBtn.addEventListener("click", () => openHotelModal(null));
}

function bindAddRoomButton(app, hotelId) {
    const addRoomBtn = document.getElementById("btn-add-room");
    if (!addRoomBtn) return;
    addRoomBtn.addEventListener("click", () => openRoomDrawer(hotelId));
}

async function loadAndPaintHotels(app) {
    const grid = document.getElementById("hotel-grid");
    if (grid) grid.innerHTML = `<p class="text-muted">Загрузка…</p>`;

    const params = {};
    if (state.search.city) params.city = state.search.city;
    if (state.search.check_in && state.search.check_out) {
        params.check_in = state.search.check_in;
        params.check_out = state.search.check_out;
    }

    try {
        state.hotels = await HotelApi.list(params);
        if (!Array.isArray(state.hotels)) state.hotels = [];
    } catch (e) {
        if (grid) {
            grid.innerHTML = `<div class="error-panel" role="alert">${escapeHtml(e.message)}</div>`;
        }
        return;
    }
    paintHotelGrid(app);
}

function paintHotelGrid(app) {
    const grid = document.getElementById("hotel-grid");
    if (!grid) return;

    if (!state.hotels.length) {
        const hint =
            state.search.city || state.search.check_in
                ? "По вашему запросу нет отелей со свободными номерами. Измените город или даты."
                : "Отелей пока нет.";
        grid.innerHTML = `<p class="text-muted">${hint}</p>`;
        return;
    }

    grid.innerHTML = state.hotels
        .map((h) => {
            const rating =
                h.rating != null && h.rating > 0
                    ? Number(h.rating).toFixed(1)
                    : "—";
            const manage = canManageHotel(h);
            const actions = manage
                ? `<div class="hotel-actions">
          <button type="button" class="btn-icon js-hotel-edit" data-id="${h.id}" title="Редактировать">✎</button>
          <button type="button" class="btn-icon js-hotel-del" data-id="${h.id}" title="Удалить">🗑</button>
        </div>`
                : "";
            const cityLine = h.city
                ? `<p class="hotel-city">${escapeHtml(h.city)}</p>`
                : "";
            return `
        <article class="hotel-card" data-id="${h.id}">
          ${actions}
          <img src="${escapeHtml(mediaUrl(h.hostel_images))}" alt="" loading="lazy" onerror="this.style.opacity=0.3" />
          <div class="hotel-card-body">
            <h3>${escapeHtml(h.title)}</h3>
            ${cityLine}
            <div class="rating-pill">★ ${rating}</div>
          </div>
        </article>`;
        })
        .join("");

    grid.querySelectorAll(".hotel-card").forEach((card) => {
        card.addEventListener("click", (ev) => {
            if (ev.target.closest(".btn-icon")) return;
            navigate("hotel", card.getAttribute("data-id"));
        });
    });
    grid.querySelectorAll(".js-hotel-edit").forEach((b) => {
        b.addEventListener("click", (e) => {
            e.stopPropagation();
            openHotelModal(b.getAttribute("data-id"));
        });
    });
    grid.querySelectorAll(".js-hotel-del").forEach((b) => {
        b.addEventListener("click", async (e) => {
            e.stopPropagation();
            if (!confirm("Удалить отель?")) return;
            try {
                await HotelApi.remove(b.getAttribute("data-id"));
                showToast("Удалено");
                await loadAndPaintHotels(app);
            } catch (err) {
                showToast(err.message);
            }
        });
    });
}

async function renderHotelsList(app) {
    await ensureProfile();

    const addBtn = isOwnerOrAdmin()
        ? `<div class="toolbar"><button type="button" class="btn btn-quiet" id="btn-add-hotel">+ Добавить отель</button></div>`
        : "";

    app.innerHTML = `
    <div class="page-head">
      <h1 class="page-title">Отели</h1>
      <p class="page-sub">Найдите отель по городу и свободным датам.</p>
    </div>
    ${renderHotelSearchBar()}
    ${addBtn}
    <div class="grid-hotels" id="hotel-grid"><p class="text-muted">Загрузка…</p></div>`;

    bindHotelSearchForm(app);
    bindAddHotelButton(app);

    try {
        await loadAndPaintHotels(app);
    } catch (e) {
        app.innerHTML = `
      <div class="page-head">
        <h1 class="page-title">Отели</h1>
        <p class="page-sub">Каталог гостиниц и номеров.</p>
      </div>
      ${renderHotelSearchBar()}
      <div class="error-panel" role="alert">${escapeHtml(e.message)}</div>
      <p class="text-muted" style="margin-top:1rem;">Локально: API <code>http://127.0.0.1:8000</code>.</p>`;
        bindHotelSearchForm(app);
    }
}

function ensureModalOverlay(id) {
    let overlay = document.getElementById(id);
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = id;
        document.body.appendChild(overlay);
    }
    return overlay;
}

function openHotelModal(hotelId) {
    const overlay = ensureModalOverlay("hotel-form-modal");
    const hotel = hotelId ? state.hotels.find((x) => x.id === hotelId) : null;
    overlay.className = "modal-overlay open";
    overlay.innerHTML = `
    <div class="modal">
      <h2>${hotel ? "Редактировать отель" : "Новый отель"}</h2>
      <form id="hotel-form">
        <input type="hidden" name="id" value="${hotel ? hotel.id : ""}" />
        <div class="field"><label>Название</label><input class="input-line" name="title" required value="${hotel ? escapeHtml(hotel.title) : ""}" ${hotel ? "readonly" : ""} /></div>
        <div class="field"><label>Город</label><input class="input-line" name="city" required value="${hotel ? escapeHtml(hotel.city || "") : ""}" placeholder="Москва" /></div>
        <div class="field"><label>Адрес</label><input class="input-line" name="address" required value="${hotel ? escapeHtml(hotel.address) : ""}" /></div>
        <div class="field"><label>Описание</label><textarea class="textarea-input" name="description" rows="3">${hotel ? escapeHtml(hotel.description) : ""}</textarea></div>
        <div class="field"><label>Фото ${hotel ? "(оставьте пустым, чтобы не менять)" : ""}</label><input type="file" name="hostel_images" accept="image/*" ${hotel ? "" : "required"} /></div>
        <div class="row-actions">
          <button type="button" class="btn btn-quiet" id="hotel-form-cancel">Отмена</button>
          <button type="submit" class="btn btn-primary mt-0">Сохранить</button>
        </div>
      </form>
    </div>`;

    const close = () => {
        overlay.classList.remove("open");
        overlay.innerHTML = "";
        overlay.remove();
    };
    overlay.onclick = (e) => {
        if (e.target === overlay) close();
    };
    document
        .getElementById("hotel-form-cancel")
        .addEventListener("click", close);

    document
        .getElementById("hotel-form")
        .addEventListener("submit", async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            try {
                if (hotel) {
                    if (
                        !fd.get("hostel_images") ||
                        !fd.get("hostel_images").size
                    )
                        fd.delete("hostel_images");
                    await HotelApi.update(hotel.id, fd);
                } else {
                    await HotelApi.create(fd);
                }
                showToast("Сохранено");
                close();
                const app = document.getElementById("app");
                renderHotelsList(app);
            } catch (err) {
                showToast(err.message);
            }
        });
}

async function renderHotelDetail(app) {
    const id = state.hotelId;
    app.innerHTML = `<p class="text-muted">Загрузка…</p>`;
    await ensureProfile();
    let hotel;
    try {
        hotel = await HotelApi.get(id);
    } catch (e) {
        app.innerHTML = `<p>Отель не найден. <button type="button" class="linklike" data-nav="hotels">К списку</button></p>`;
        app.querySelector("[data-nav]").addEventListener("click", () =>
            navigate("hotels"),
        );
        return;
    }

    const roomParams = {};
    if (state.search.check_in && state.search.check_out) {
        roomParams.check_in = state.search.check_in;
        roomParams.check_out = state.search.check_out;
    }

    let roomsRes;
    try {
        roomsRes = await HotelApi.listRooms(id, roomParams);
    } catch {
        roomsRes = { data: [] };
    }
    const rooms = roomsRes.data || roomsRes.results || roomsRes || [];
    const roomList = Array.isArray(rooms) ? rooms : [];

    let revRes;
    try {
        revRes = await HotelApi.listReviews(id);
    } catch {
        revRes = { data: [] };
    }
    const reviews = revRes.data || [];

    const rating =
        hotel.rating != null && hotel.rating > 0
            ? Number(hotel.rating).toFixed(1)
            : "—";
    const manage = canManageHotel(hotel);
    const addRoomBtn = manage
        ? `<div class="hotels-toolbar"><button type="button" class="btn btn-quiet" id="btn-add-room">+ Добавить номер</button></div>`
        : "";

    app.innerHTML = `
    <p><button type="button" class="linklike" id="back-hotels">← К отелям</button></p>
    <div class="page-head">
      <h1 class="page-title">${escapeHtml(hotel.title)} <span class="rating-pill">★ ${rating}</span></h1>
      <p class="page-sub">${hotel.city ? `${escapeHtml(hotel.city)} · ` : ""}${escapeHtml(hotel.address)}</p>
    </div>
    <div class="detail-hero">
      <img src="${escapeHtml(mediaUrl(hotel.hostel_images))}" alt="" onerror="this.style.display='none'" />
      <p class="text-muted detail-desc">${escapeHtml(hotel.description)}</p>
    </div>
    <h2 class="section-label"><span>Номера</span></h2>
    ${addRoomBtn}
    <div id="rooms-list"></div>
    <h2 class="section-label"><span>Отзывы</span></h2>
    <div id="reviews-block"></div>
    <div id="drawer-root"></div>
    <div id="booking-modal-root"></div>`;

    document
        .getElementById("back-hotels")
        .addEventListener("click", () => navigate("hotels"));

    const roomsEl = document.getElementById("rooms-list");
    if (!roomList.length) {
        const noRoomsMsg =
            state.search.check_in && state.search.check_out
                ? "На выбранные даты свободных номеров нет."
                : "Номеров пока нет.";
        roomsEl.innerHTML = `<p class="text-muted">${noRoomsMsg}</p>`;
    } else
        roomsEl.innerHTML = roomList
            .map((r) => {
                const typeLabel = ROOM_TYPE_LABEL[r.type] || r.type;
                const bookBtn = isDefaultUser()
                    ? `<button type="button" class="btn btn-quiet js-book" data-room="${r.id}" data-price="${r.price_on_one_day}">Забронировать</button>`
                    : "";
                const rowManage = manage
                    ? `<span>
          <button type="button" class="linklike js-room-edit" data-room="${r.id}">Изменить</button>
          <button type="button" class="linklike js-room-del" data-room="${r.id}">Удалить</button>
        </span>`
                    : "";
                return `
        <div class="room-row" data-room="${r.id}">
          <img src="${escapeHtml(mediaUrl(r.room_images))}" alt="" />
          <div>
            <strong>${escapeHtml(typeLabel)}</strong>
            <div class="room-meta">${escapeHtml(r.description || "")}</div>
            ${rowManage}
          </div>
          <div class="room-price">${Number(r.price_on_one_day).toLocaleString("ru-RU")} ₽ / ночь<br>${bookBtn}</div>
        </div>`;
            })
            .join("");

    if (!roomList.length) {
        renderReviewsBlock(
            document.getElementById("reviews-block"),
            reviews,
            id,
        );
        return;
    }

    roomsEl.querySelectorAll(".js-book").forEach((b) => {
        b.addEventListener("click", () =>
            openBookingModal(
                b.getAttribute("data-room"),
                b.getAttribute("data-price"),
                hotel.title,
            ),
        );
    });
    roomsEl.querySelectorAll(".js-room-del").forEach((b) => {
        b.addEventListener("click", async (ev) => {
            ev.stopPropagation();
            if (!confirm("Удалить номер?")) return;
            try {
                await RoomApi.remove(b.getAttribute("data-room"));
                showToast("Номер удалён");
                renderHotelDetail(app);
            } catch (err) {
                showToast(err.message);
            }
        });
    });
    roomsEl.querySelectorAll(".js-room-edit").forEach((b) => {
        b.addEventListener("click", (ev) => {
            ev.stopPropagation();
            const rid = b.getAttribute("data-room");
            const room = roomList.find((x) => x.id === rid);
            openRoomEditModal(room, id);
        });
    });

    bindAddRoomButton(app, id);

    renderReviewsBlock(document.getElementById("reviews-block"), reviews, id);
}

function openRoomDrawer(hotelId) {
    const root = document.getElementById("drawer-root");
    root.innerHTML = `
    <div class="drawer-overlay" id="drawer-ov"></div>
    <aside class="drawer" id="drawer-panel">
      <h2>Новый номер</h2>
      <form id="room-create-form">
        <div class="field"><label>Тип</label>
          <select class="select-input" name="type">
            <option value="standard">Стандарт</option>
            <option value="deluxe">Люкс</option>
          </select>
        </div>
        <div class="field"><label>Цена за ночь</label><input class="input-line" name="price_on_one_day" type="number" min="1" required /></div>
        <div class="field"><label>Описание</label><textarea class="textarea-input" name="description" rows="3"></textarea></div>
        <div class="field"><label>Фото</label><input type="file" name="room_images" accept="image/*" required /></div>
        <button type="submit" class="btn btn-primary btn-block">Сохранить</button>
      </form>
    </aside>`;
    requestAnimationFrame(() => {
        document.getElementById("drawer-ov").classList.add("open");
        document.getElementById("drawer-panel").classList.add("open");
    });

    const close = () => {
        document.getElementById("drawer-ov").classList.remove("open");
        document.getElementById("drawer-panel").classList.remove("open");
        setTimeout(() => {
            root.innerHTML = "";
        }, 220);
    };
    document.getElementById("drawer-ov").addEventListener("click", close);

    document
        .getElementById("room-create-form")
        .addEventListener("submit", async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            try {
                await HotelApi.createRoom(hotelId, fd);
                showToast("Номер добавлен");
                close();
                renderHotelDetail(document.getElementById("app"));
            } catch (err) {
                showToast(err.message);
            }
        });
}

function openRoomEditModal(room, hotelId) {
    const overlay = document.getElementById("booking-modal-root");
    overlay.className = "modal-overlay open";
    overlay.innerHTML = `
    <div class="modal">
      <h2>Редактировать номер</h2>
      <form id="room-patch-form">
        <div class="field"><label>Цена за ночь</label><input class="input-line" name="price_on_one_day" type="number" value="${room.price_on_one_day}" required /></div>
        <div class="field"><label>Описание</label><textarea class="textarea-input" name="description" rows="3">${escapeHtml(room.description || "")}</textarea></div>
        <div class="field"><label>Новое фото (необязательно)</label><input type="file" name="room_images" accept="image/*" /></div>
        <div class="row-actions">
          <button type="button" class="btn btn-quiet" id="rm-close">Закрыть</button>
          <button type="submit" class="btn btn-primary mt-0">Сохранить</button>
        </div>
      </form>
    </div>`;
    const close = () => {
        overlay.classList.remove("open");
        overlay.innerHTML = "";
        overlay.className = "";
    };
    overlay.onclick = (e) => {
        if (e.target === overlay) close();
    };
    document.getElementById("rm-close").addEventListener("click", close);
    document
        .getElementById("room-patch-form")
        .addEventListener("submit", async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            if (!fd.get("room_images") || !fd.get("room_images").size)
                fd.delete("room_images");
            try {
                await RoomApi.update(room.id, fd);
                showToast("Сохранено");
                close();
                renderHotelDetail(document.getElementById("app"));
            } catch (err) {
                showToast(err.message);
            }
        });
}

function openBookingModal(roomId, pricePerDay, hotelTitle) {
    const root = document.getElementById("booking-modal-root");
    root.className = "modal-overlay open";
    root.innerHTML = `
    <div class="modal">
      <h2>Бронирование</h2>
      <p class="text-muted">${escapeHtml(hotelTitle)}</p>
      <div class="field"><label>Заезд</label><input class="input-line" type="date" id="bk-in" required /></div>
      <div class="field"><label>Выезд</label><input class="input-line" type="date" id="bk-out" required /></div>
      <div class="price-big" id="bk-price">Выберите даты</div>
      <button type="button" class="btn btn-primary btn-block" id="bk-confirm">Подтвердить</button>
      <button type="button" class="btn btn-quiet btn-full" id="bk-cancel">Отмена</button>
    </div>`;

    const priceEl = document.getElementById("bk-price");
    const inEl = document.getElementById("bk-in");
    const outEl = document.getElementById("bk-out");
    if (state.search.check_in) inEl.value = state.search.check_in;
    if (state.search.check_out) outEl.value = state.search.check_out;

    const refreshPrice = async () => {
        const cin = inEl.value;
        const cout = outEl.value;
        if (!cin || !cout) {
            priceEl.textContent = "Выберите даты";
            return;
        }
        const n = nightsBetween(cin, cout);
        if (n <= 0) {
            priceEl.textContent = "Дата выезда должна быть позже заезда";
            return;
        }
        priceEl.textContent = "Расчёт…";
        try {
            await BookingApi.finalPrice();
        } catch {
            /* бэкенд не считает по датам — игнорируем */
        }
        const total = computeStayPrice(pricePerDay, cin, cout);
        priceEl.textContent = `${total.toLocaleString("ru-RU")} ₽`;
    };
    inEl.addEventListener("change", refreshPrice);
    outEl.addEventListener("change", refreshPrice);

    const close = () => {
        root.classList.remove("open");
        root.innerHTML = "";
        root.className = "";
    };
    document.getElementById("bk-cancel").addEventListener("click", close);
    root.onclick = (e) => {
        if (e.target === root) close();
    };

    document
        .getElementById("bk-confirm")
        .addEventListener("click", async () => {
            try {
                await RoomApi.createBooking(roomId, {
                    check_in: inEl.value,
                    check_out: outEl.value,
                });
                showToast("Бронирование создано");
                close();
            } catch (err) {
                showToast(err.message);
            }
        });
}

function renderReviewsBlock(container, reviews, hotelId) {
    const uid = getUserId();
    const role = state.profile && state.profile.roles;
    let reviewForm = "";
    if (isDefaultUser()) {
        reviewForm = `
      <button type="button" class="btn btn-quiet" id="toggle-review">Оставить отзыв</button>
      <div id="review-form-wrap" class="hidden panel-nested">
        <div class="stars-input" id="stars-input">${[1, 2, 3, 4, 5].map((i) => `<span data-s="${i}">★</span>`).join("")}</div>
        <div id="review-text-wrap" class="hidden">
          <textarea class="textarea-input" id="review-text" rows="3" placeholder="Комментарий"></textarea>
          <button type="button" class="btn btn-primary btn-block" id="review-submit">Отправить</button>
        </div>
      </div>`;
    }

    container.innerHTML = `
    ${reviewForm}
    <div class="reviews-list">${reviews
        .map((rev) => {
            const mine = uid && String(rev.user) === String(uid);
            let actions = "";
            if (mine && isDefaultUser()) {
                actions = `<div class="review-actions">
            <button type="button" class="js-rev-edit" data-id="${rev.id}">Редактировать</button>
            <button type="button" class="js-rev-del" data-id="${rev.id}">Удалить</button>
          </div>`;
            } else if (role === "Admin") {
                actions = `<div class="review-actions"><button type="button" class="js-rev-del" data-id="${rev.id}" title="Удалить">🗑 Удалить</button></div>`;
            }
            return `<div class="review-card">
          <div>★ ${rev.score} <span class="text-muted">${escapeHtml(String(rev.created_at || ""))}</span></div>
          <p>${escapeHtml(rev.comment_text || "")}</p>
          ${actions}
        </div>`;
        })
        .join("")}</div>`;

    let scoreSel = 0;
    const stars = container.querySelectorAll("#stars-input span");
    const textWrap = container.querySelector("#review-text-wrap");
    stars.forEach((s) => {
        s.addEventListener("click", () => {
            scoreSel = Number(s.getAttribute("data-s"));
            stars.forEach((x, idx) => x.classList.toggle("on", idx < scoreSel));
            textWrap.classList.remove("hidden");
        });
    });

    const toggle = container.querySelector("#toggle-review");
    if (toggle) {
        toggle.addEventListener("click", () => {
            document
                .getElementById("review-form-wrap")
                .classList.toggle("hidden");
        });
    }

    const submit = container.querySelector("#review-submit");
    if (submit) {
        submit.addEventListener("click", async () => {
            const text = document.getElementById("review-text").value;
            if (!scoreSel) {
                showToast("Выберите оценку");
                return;
            }
            try {
                await HotelApi.createReview(hotelId, {
                    score: scoreSel,
                    comment_text: text,
                });
                showToast("Отзыв отправлен");
                renderHotelDetail(document.getElementById("app"));
            } catch (err) {
                showToast(err.message);
            }
        });
    }

    container.querySelectorAll(".js-rev-del").forEach((b) => {
        b.addEventListener("click", async () => {
            if (!confirm("Удалить отзыв?")) return;
            try {
                await ReviewApi.remove(b.getAttribute("data-id"));
                showToast("Удалено");
                renderHotelDetail(document.getElementById("app"));
            } catch (err) {
                showToast(err.message);
            }
        });
    });

    container.querySelectorAll(".js-rev-edit").forEach((b) => {
        b.addEventListener("click", async () => {
            const id = b.getAttribute("data-id");
            const rev = reviews.find((r) => r.id === id);
            const nt = prompt("Новый текст", rev.comment_text || "");
            if (nt == null) return;
            const ns = prompt("Оценка 1-5", String(rev.score));
            if (ns == null) return;
            try {
                await ReviewApi.update(id, {
                    comment_text: nt,
                    score: Number(ns),
                });
                showToast("Обновлено");
                renderHotelDetail(document.getElementById("app"));
            } catch (err) {
                showToast(err.message);
            }
        });
    });
}

async function renderBookingsPage(app) {
    app.innerHTML = `<div class="page-head"><h1 class="page-title">Бронирования</h1><p class="page-sub">История и управление по ролям.</p></div><p class="text-muted">Загрузка…</p>`;
    await ensureProfile();
    const role = state.profile && state.profile.roles;
    let rows = [];
    try {
        rows = await BookingApi.list();
        if (!Array.isArray(rows)) rows = [];
    } catch (e) {
        app.innerHTML = `
      <div class="page-head"><h1 class="page-title">Бронирования</h1><p class="page-sub">История и управление по ролям.</p></div>
      <div class="error-panel">${escapeHtml(e.message)}</div>`;
        return;
    }

    let hotels = state.hotels.length ? state.hotels : [];
    try {
        if (!hotels.length) hotels = await HotelApi.list();
    } catch {
        hotels = [];
    }
    const hotelByRoom = {};
    for (const h of hotels) {
        try {
            const rr = await HotelApi.listRooms(h.id);
            const list = rr.data || [];
            for (const room of list) hotelByRoom[room.id] = h;
        } catch {
            /* skip */
        }
    }

    let filterHtml = "";
    if (role === "Owner") {
        const mine = hotels.filter(
            (h) => String(h.owner) === String(getUserId()),
        );
        filterHtml = `
      <div class="filters-bar">
        <label>Отель <select id="flt-hotel"><option value="">Все мои</option>${mine.map((h) => `<option value="${h.id}">${escapeHtml(h.title)}</option>`).join("")}</select></label>
      </div>`;
    } else if (role === "Admin") {
        filterHtml = `
      <div class="filters-bar">
        <input type="text" id="flt-user" placeholder="ID пользователя" />
        <input type="text" id="flt-hotel-admin" placeholder="ID отеля" />
        <input type="text" id="flt-room" placeholder="ID номера" />
      </div>`;
    }

    const bodyRows = (list) =>
        list
            .map((b) => {
                const h = hotelByRoom[b.room];
                const hotelTitle = h
                    ? h.title
                    : `номер ${String(b.room).slice(0, 8)}…`;
                const cancel =
                    role === "Default_user"
                        ? `<button type="button" class="linklike js-bk-cancel" data-id="${b.id}">Отменить</button>`
                        : "";
                const contact =
                    role === "Owner"
                        ? `<button type="button" class="linklike js-contact" data-user="${b.user}">Связь</button>`
                        : "";
                const adminDel =
                    role === "Admin"
                        ? `<button type="button" class="linklike js-bk-del" data-id="${b.id}">Удалить</button>`
                        : "";
                return `<tr>
        <td>${escapeHtml(hotelTitle)}</td>
        <td>${escapeHtml(String(b.check_in))} — ${escapeHtml(String(b.check_out))}</td>
        ${role !== "Default_user" ? `<td class="text-muted">${escapeHtml(String(b.user))}</td>` : ""}
        <td>${Number(b.total_price || 0).toLocaleString("ru-RU")} ₽</td>
        <td>${cancel}${contact}${adminDel}</td>
      </tr>`;
            })
            .join("");

    const thead =
        role === "Default_user"
            ? `<tr><th>Отель</th><th>Даты</th><th>Стоимость</th><th></th></tr>`
            : `<tr><th>Отель</th><th>Даты</th><th>Клиент (id)</th><th>Стоимость</th><th></th></tr>`;

    app.innerHTML = `
    <div class="page-head">
      <h1 class="page-title">Бронирования</h1>
      <p class="page-sub">Таблица броней: для гостя — свои поездки; для отельера — с фильтром; для администратора — поиск по id.</p>
    </div>
    ${filterHtml}
    <div class="table-wrap"><table class="data"><thead>${thead}</thead><tbody id="bk-body">${bodyRows(rows)}</tbody></table></div>`;

    const tbody = document.getElementById("bk-body");

    function applyFilters() {
        let list = rows;
        if (role === "Owner") {
            const sel = document.getElementById("flt-hotel");
            const hid = sel && sel.value;
            if (hid)
                list = list.filter(
                    (b) =>
                        hotelByRoom[b.room] && hotelByRoom[b.room].id === hid,
                );
        }
        if (role === "Admin") {
            const u =
                (document.getElementById("flt-user") &&
                    document.getElementById("flt-user").value) ||
                "";
            const hotelId =
                (document.getElementById("flt-hotel-admin") &&
                    document.getElementById("flt-hotel-admin").value) ||
                "";
            const roomId =
                (document.getElementById("flt-room") &&
                    document.getElementById("flt-room").value) ||
                "";
            if (u) list = list.filter((b) => String(b.user).includes(u));
            if (hotelId)
                list = list.filter(
                    (b) =>
                        hotelByRoom[b.room] &&
                        String(hotelByRoom[b.room].id).includes(hotelId),
                );
            if (roomId)
                list = list.filter((b) => String(b.room).includes(roomId));
        }
        tbody.innerHTML = bodyRows(list);
        bindBookingRowActions(tbody);
    }

    if (role === "Owner") {
        document
            .getElementById("flt-hotel")
            .addEventListener("change", applyFilters);
    }
    if (role === "Admin") {
        ["flt-user", "flt-hotel-admin", "flt-room"].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener("input", applyFilters);
        });
    }

    function bindBookingRowActions(rootEl) {
        rootEl.querySelectorAll(".js-bk-cancel").forEach((btn) => {
            btn.addEventListener("click", async () => {
                if (!confirm("Отменить бронь?")) return;
                try {
                    await BookingApi.remove(btn.getAttribute("data-id"));
                    showToast("Отменено");
                    renderBookingsPage(document.getElementById("app"));
                } catch (err) {
                    showToast(err.message);
                }
            });
        });
        rootEl.querySelectorAll(".js-bk-del").forEach((btn) => {
            btn.addEventListener("click", async () => {
                if (!confirm("Удалить бронирование?")) return;
                try {
                    await BookingApi.remove(btn.getAttribute("data-id"));
                    showToast("Удалено");
                    renderBookingsPage(document.getElementById("app"));
                } catch (err) {
                    showToast(err.message);
                }
            });
        });
        rootEl.querySelectorAll(".js-contact").forEach((btn) => {
            btn.addEventListener("click", () => {
                showToast(
                    `Клиент: ${btn.getAttribute("data-user")} — уведомление по API не настроено`,
                );
            });
        });
    }

    bindBookingRowActions(tbody);
}


function handleNavClick(e, el) {
    e.preventDefault();
    const nav = el.getAttribute("data-nav");
    if (!nav) return;
    if (nav === "auth") {
        if (getToken()) {
            setToken(null);
            setUserId(null);
            state.profile = null;
            showToast("Вы вышли");
            navigate("hotels");
        } else {
            navigate("auth");
        }
        return;
    }
    navigate(nav);
}

function bindGlobalNav() {
    if (bindGlobalNav._done) return;
    bindGlobalNav._done = true;

    document.addEventListener("click", (e) => {
        const addRoomBtn = e.target.closest("#btn-add-room");
        if (addRoomBtn) {
            e.preventDefault();
            openRoomDrawer(state.hotelId);
            return;
        }
    });

    document.addEventListener("click", (e) => {
        const el = e.target.closest("[data-nav]");
        if (!el) return;
        handleNavClick(e, el);
    });
}

window.addEventListener("hashchange", () => {
    parseHash();
    render();
});

async function initApp() {
    bindGlobalNav();
    parseHash();
    try {
        await loadProfile();
    } catch {
        state.profile = null;
    }
    render();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}
