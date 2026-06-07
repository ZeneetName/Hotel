import { showSection, hotelDetailSection } from "../../shared/ui/dom.js";
import { pushState } from "../../shared/lib/history.js";
import Toast from "../../shared/ui/toast.js";
import { btnDeleteHtml } from "../../shared/ui/btn-delete.js";
import { getUser } from "../../entities/user/session.js";
import { amenityChipsHtml, ROOM_AMENITIES } from "../../entities/room/amenities.js";
import { roomApi } from "../../entities/room/api.js";
import { dishApi } from "../../entities/dish/api.js";
import { serviceApi } from "../../entities/service/api.js";
import { reviewApi } from "../../entities/review/api.js";
import { renderHotels } from "../hotels/index.js";
import { showEditHotelPage, showDeleteHotelConfirm } from "../../features/hotel-manage/index.js";
import { showCreateRoomModal, showEditRoomModal, showDeleteRoomConfirm } from "../../features/room-manage/index.js";
import { showBookingModalForRoom } from "../../features/booking/index.js";
import { showCreateDishModal, showEditDishModal } from "../../features/dish-manage/index.js";
import { showCreateServiceModal, showEditServiceModal } from "../../features/service-manage/index.js";
import { showRoomDetailModal } from "../../widgets/room-detail-modal/index.js";
import { loadReviews } from "../../widgets/reviews/index.js";

const noImg = (url) =>
    url ? url.replace("http://localhost", "") : "";

export async function renderHotelDetail(hotel, skipHistory = false) {
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

    const ratingNum = Number(hotel.rating) || 0;
    const ratingText = ratingNum > 0 ? ratingNum.toFixed(1).replace(/\.0$/, "") : "—";
    const heroImg = noImg(hotel.hostel_images);
    const ownerName = hotel.owner_full_name || "Владелец";
    const ownerInitial = ownerName.charAt(0).toUpperCase();

    hotelDetailSection.innerHTML = `
    <div class="hd">
        <nav class="hd-nav">
            <div class="hd-nav-inner">
                <div class="hd-nav-left">
                    <button class="hd-back back-btn">‹ Назад к поиску</button>
                    <span class="hd-nav-sep"></span>
                    <span class="hd-logo">StayLux</span>
                </div>
                <div class="hd-nav-right">
                    ${isOwner
            ? `<button class="hd-nav-btn edit-hotel-btn">✎ Редактировать</button>
                           ${btnDeleteHtml.replace('class="button"', 'class="button delete-hotel-btn"')}`
            : `<button class="hd-nav-btn hd-nav-ghost">♡ Сохранить</button>
                           <button class="hd-nav-btn hd-nav-ghost">↗ Поделиться</button>`}
                </div>
            </div>
        </nav>

        <div class="hd-container">
            <header class="hd-head">
                <div class="hd-eyebrow">
                    <span class="hd-badge">5 ЗВЁЗД</span>
                    <span class="hd-editor">🏆 Выбор редакции 2026</span>
                </div>
                <h1 class="hd-title">${hotel.title}</h1>
                <div class="hd-meta">
                    <span class="hd-loc">📍 ${[hotel.address, hotel.city].filter(Boolean).join(", ") || "Адрес не указан"}</span>
                    <span class="hd-rate">
                        <span class="hd-stars">★★★★★</span>
                        <b>${ratingText}</b>
                        <span class="hd-rate-count" data-reviews-count>(0 отзывов)</span>
                    </span>
                </div>
            </header>

            <div class="hd-gallery">
                <div class="hd-gallery-main" style="${heroImg ? `background-image:url('${heroImg}')` : ""}"></div>
                <div class="hd-gallery-cell" data-gallery-cell="0"></div>
                <div class="hd-gallery-cell" data-gallery-cell="1"></div>
                <div class="hd-gallery-cell" data-gallery-cell="2"></div>
                <div class="hd-gallery-cell" data-gallery-cell="3"></div>
            </div>

            <div class="hd-tabs">
                <button class="hd-tab active" data-tab="overview">Обзор</button>
                <button class="hd-tab" data-tab="rooms">Номера</button>
                <button class="hd-tab" data-tab="amenities">Удобства</button>
                <button class="hd-tab" data-tab="reviews">Отзывы</button>
            </div>

            <div class="hd-layout">
                <div class="hd-main">
                    <!-- OVERVIEW -->
                    <section class="hd-tabpanel" data-panel="overview">
                        <div class="hd-block">
                            <h2>Об отеле</h2>
                            <p class="hd-text">${hotel.description || "Описание отеля пока не добавлено."}</p>
                        </div>
                        <div class="hd-facts" data-facts></div>
                        <div class="hd-block hd-included" data-included hidden>
                            <h2>Что включено</h2>
                            <div class="hd-amenities-grid" data-amenities-grid></div>
                        </div>
                        <div class="hd-block">
                            <h2>Расположение</h2>
                            <div class="hd-map">
                                <span class="hd-map-pin">📍</span>
                                <p>${hotel.address || "Адрес не указан"}</p>
                                <p class="text-muted">${hotel.city || ""}</p>
                            </div>
                        </div>
                    </section>

                    <!-- ROOMS -->
                    <section class="hd-tabpanel" data-panel="rooms" hidden>
                        <div class="hd-section-head">
                            <h2>Доступные номера</h2>
                            ${isOwner ? `<button class="btn add-room-btn">+ Добавить номер</button>` : ""}
                        </div>
                        <div class="rooms-list hd-rooms"></div>
                    </section>

                    <!-- AMENITIES (menu & services) -->
                    <section class="hd-tabpanel" data-panel="amenities" hidden>
                        <div class="hd-section-head">
                            <h2>Удобства и услуги</h2>
                            ${isOwner
            ? `<div class="hd-head-actions">
                                       <button class="btn btn-small add-menu-btn">+ Меню</button>
                                       <button class="btn btn-small add-service-btn">+ Услугу</button>
                                   </div>`
            : ""}
                        </div>
                        <div class="hd-addtabs">
                            <button class="additional-btn active" data-type="menu">Меню</button>
                            <button class="additional-btn" data-type="services">Услуги</button>
                        </div>
                        <div class="additional-content"></div>
                    </section>

                    <!-- REVIEWS -->
                    <section class="hd-tabpanel" data-panel="reviews" hidden>
                        <div class="hd-review-summary">
                            <div class="hd-review-score">
                                <p class="hd-review-big">${ratingText}</p>
                                <div class="hd-stars">★★★★★</div>
                                <p class="text-muted" data-reviews-count2>0 отзывов</p>
                            </div>
                        </div>
                        <div class="reviews-list"></div>
                    </section>
                </div>

                <aside class="hd-side">
                    <div class="owner-card">
                        <div class="owner-card-head">
                            <div class="owner-card-avatar">${ownerInitial}</div>
                            <div class="owner-card-headinfo">
                                <p class="owner-card-name">${ownerName}</p>
                                <p class="owner-card-role">Управляющий отелем</p>
                                <p class="owner-card-verified">🛡 Верифицированный владелец</p>
                            </div>
                        </div>
                        <div class="owner-card-body">
                            <div class="owner-card-stats">
                                <div class="owner-stat"><b>${ratingText}</b><span>рейтинг</span></div>
                                <div class="owner-stat"><b data-reviews-num>0</b><span>отзывов</span></div>
                                <div class="owner-stat"><b data-rooms-num>—</b><span>номеров</span></div>
                            </div>
                            <div class="owner-card-badges">
                                <div class="owner-badge">🏆 <span>Суперхозяин 2024–2026</span></div>
                                <div class="owner-badge">⏱ <span>Отвечает в течение часа</span></div>
                                <div class="owner-badge">⭐ <span>Более 95% положительных отзывов</span></div>
                            </div>
                            <p class="owner-card-bio">Рады приветствовать вас в «${hotel.title}». Мы делаем всё, чтобы ваш отдых был незабываемым — от бронирования до последнего дня пребывания.</p>
                            <div class="owner-card-divider"></div>
                            <div class="owner-card-actions">
                                ${hotel.owner_email
            ? `<a class="owner-act owner-act-primary" href="mailto:${hotel.owner_email}">✉ Написать владельцу</a>`
            : `<span class="owner-act owner-act-primary owner-act-disabled">✉ Написать владельцу</span>`}
                                ${hotel.owner_phone
            ? `<a class="owner-act owner-act-ghost" href="tel:${hotel.owner_phone}">📞 ${hotel.owner_phone}</a>`
            : ""}
                            </div>
                            <p class="owner-card-note">Бесплатная отмена до 48 часов до заезда</p>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    </div>
    `;

    // ---- Navigation / owner controls ----
    hotelDetailSection.querySelector(".back-btn").onclick = () => renderHotels();

    if (isOwner) {
        const editHotelBtn = hotelDetailSection.querySelector(".edit-hotel-btn");
        const deleteHotelBtn = hotelDetailSection.querySelector(".delete-hotel-btn");
        if (editHotelBtn) editHotelBtn.onclick = () => showEditHotelPage(hotel);
        if (deleteHotelBtn) deleteHotelBtn.onclick = () => showDeleteHotelConfirm(hotel);
    }

    // ---- Tab switching ----
    const tabs = hotelDetailSection.querySelectorAll(".hd-tab");
    const panels = hotelDetailSection.querySelectorAll(".hd-tabpanel");
    let amenitiesLoaded = false;
    tabs.forEach((tab) => {
        tab.onclick = () => {
            tabs.forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");
            const name = tab.getAttribute("data-tab");
            panels.forEach((p) => {
                p.hidden = p.getAttribute("data-panel") !== name;
            });
            // Lazy-load the menu tab the first time it is opened.
            if (name === "amenities" && !amenitiesLoaded) {
                amenitiesLoaded = true;
                hotelDetailSection
                    .querySelector('.additional-btn[data-type="menu"]')
                    ?.click();
            }
        };
    });

    // ---- Additional: menu & services ----
    const additionalBtns = hotelDetailSection.querySelectorAll(".additional-btn");
    const additionalContent = hotelDetailSection.querySelector(".additional-content");

    additionalBtns.forEach((btn) => {
        btn.onclick = async () => {
            const type = btn.getAttribute("data-type");
            additionalBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            additionalContent.style.display = "block";

            try {
                let items = [];
                if (type === "menu") {
                    const res = await dishApi.list(hotel.id);
                    items = res.data || res;
                    if (!items || !items.length) {
                        additionalContent.innerHTML = `<p class="text-muted">Меню гостиницы не добавлено</p>`;
                    } else {
                        additionalContent.innerHTML = `
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
                                        ${isOwner
                                            ? `<div class="dish-card-actions">
                                                   <button class="btn-small edit-dish-btn" data-dish-id="${dish.id}">✏️</button>
                                                   <button class="btn-small delete-dish-btn" data-dish-id="${dish.id}">🗑️</button>
                                               </div>`
                                            : ""}
                                    </div>`,
                                )
                                .join("")}
                            </div>`;
                    }
                } else if (type === "services") {
                    const res = await serviceApi.list(hotel.id);
                    items = res.data || res;
                    if (!items || !items.length) {
                        additionalContent.innerHTML = `<p class="text-muted">Услуги не добавлены</p>`;
                    } else {
                        additionalContent.innerHTML = `
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
                                        ${isOwner
                                            ? `<div class="service-card-actions">
                                                   <button class="btn-small edit-service-btn" data-service-id="${service.id}">✏️</button>
                                                   <button class="btn-small delete-service-btn" data-service-id="${service.id}">🗑️</button>
                                               </div>`
                                            : ""}
                                    </div>`,
                                )
                                .join("")}
                            </div>`;
                    }
                }

                if (isOwner && items.length > 0) {
                    if (type === "menu") {
                        additionalContent.querySelectorAll(".edit-dish-btn").forEach((b) => {
                            b.onclick = () => {
                                const dish = items.find((d) => d.id == b.getAttribute("data-dish-id"));
                                showEditDishModal(hotel, dish);
                            };
                        });
                        additionalContent.querySelectorAll(".delete-dish-btn").forEach((b) => {
                            b.onclick = async () => {
                                if (confirm("Вы уверены, что хотите удалить блюдо?")) {
                                    try {
                                        await dishApi.remove(b.getAttribute("data-dish-id"));
                                        Toast.success("Блюдо удалено");
                                        hotelDetailSection.querySelector('.additional-btn[data-type="menu"]')?.click();
                                    } catch {
                                        Toast.error("Ошибка при удалении блюда");
                                    }
                                }
                            };
                        });
                    } else if (type === "services") {
                        additionalContent.querySelectorAll(".edit-service-btn").forEach((b) => {
                            b.onclick = () => {
                                const service = items.find((s) => s.id == b.getAttribute("data-service-id"));
                                showEditServiceModal(hotel, service);
                            };
                        });
                        additionalContent.querySelectorAll(".delete-service-btn").forEach((b) => {
                            b.onclick = async () => {
                                if (confirm("Вы уверены, что хотите удалить услугу?")) {
                                    try {
                                        await serviceApi.remove(b.getAttribute("data-service-id"));
                                        Toast.success("Услуга удалена");
                                        hotelDetailSection.querySelector('.additional-btn[data-type="services"]')?.click();
                                    } catch {
                                        Toast.error("Ошибка при удалении услуги");
                                    }
                                }
                            };
                        });
                    }
                }
            } catch (err) {
                console.error("Ошибка загрузки:", err);
                additionalContent.innerHTML = `<p class="text-muted">Ошибка загрузки</p>`;
            }
        };
    });

    if (isOwner) {
        const addMenuBtn = hotelDetailSection.querySelector(".add-menu-btn");
        const addServiceBtn = hotelDetailSection.querySelector(".add-service-btn");
        if (addMenuBtn) addMenuBtn.onclick = () => showCreateDishModal(hotel);
        if (addServiceBtn) addServiceBtn.onclick = () => showCreateServiceModal(hotel);
        const addRoomBtn = hotelDetailSection.querySelector(".add-room-btn");
        if (addRoomBtn) addRoomBtn.onclick = () => showCreateRoomModal(hotel);
    }

    // ---- Reviews count (for header & owner stats) ----
    reviewApi
        .list(hotel.id)
        .then((res) => {
            const count = (res.data || []).length;
            const word = count % 10 === 1 && count % 100 !== 11 ? "отзыв" : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20) ? "отзыва" : "отзывов";
            const c1 = hotelDetailSection.querySelector("[data-reviews-count]");
            const c2 = hotelDetailSection.querySelector("[data-reviews-count2]");
            const cn = hotelDetailSection.querySelector("[data-reviews-num]");
            if (c1) c1.textContent = `(${count} ${word})`;
            if (c2) c2.textContent = `${count} ${word}`;
            if (cn) cn.textContent = count;
        })
        .catch(() => {});

    // ---- Rooms ----
    try {
        const res = await roomApi.list(hotel.id);
        const rooms = res.data || res;
        const list = hotelDetailSection.querySelector(".rooms-list");

        // Facts (overview)
        const factsEl = hotelDetailSection.querySelector("[data-facts]");
        const roomsNumEl = hotelDetailSection.querySelector("[data-rooms-num]");
        if (roomsNumEl) roomsNumEl.textContent = rooms.length;

        if (factsEl) {
            const prices = rooms.map((r) => Number(r.price_on_one_day)).filter((n) => n > 0);
            const places = rooms.map((r) => Number(r.max_place)).filter((n) => n > 0);
            const minPrice = prices.length ? Math.min(...prices) : null;
            const maxPlace = places.length ? Math.max(...places) : null;
            const facts = [
                { v: rooms.length, l: "номеров" },
                { v: minPrice != null ? `${minPrice} ₽` : "—", l: "от / ночь" },
                { v: maxPlace != null ? maxPlace : "—", l: "макс. гостей" },
                { v: ratingText, l: "рейтинг" },
            ];
            factsEl.innerHTML = facts
                .map((f) => `<div class="hd-fact"><p class="hd-fact-val">${f.v}</p><p class="hd-fact-label">${f.l}</p></div>`)
                .join("");
        }

        // "Что включено" — aggregate unique amenities across rooms
        const includedEl = hotelDetailSection.querySelector("[data-included]");
        const amenitiesGrid = hotelDetailSection.querySelector("[data-amenities-grid]");
        if (includedEl && amenitiesGrid) {
            const keys = new Set();
            rooms.forEach((r) => (r.amenities || []).forEach((k) => keys.add(k)));
            const list2 = ROOM_AMENITIES.filter((a) => keys.has(a.key));
            if (list2.length) {
                includedEl.hidden = false;
                amenitiesGrid.innerHTML = list2
                    .map((a) => `<div class="hd-amenity"><span class="hd-amenity-ic">${a.icon}</span><span>${a.label}</span></div>`)
                    .join("");
            }
        }

        // Gallery cells — fill with room images
        rooms.slice(0, 4).forEach((r, i) => {
            const cell = hotelDetailSection.querySelector(`[data-gallery-cell="${i}"]`);
            const img = noImg(r.room_images);
            if (cell && img) cell.style.backgroundImage = `url('${img}')`;
        });

        // Room cards
        if (!rooms.length) {
            list.innerHTML = `<p class="text-muted">В этой гостинице пока нет номеров.</p>`;
        } else {
            list.innerHTML = rooms
                .map((r) => {
                    const img = noImg(r.room_images);
                    const typeLabel = r.type === "standard" ? "Стандартный" : "Люкс";
                    return `
                    <div class="hd-room room-card-detail" data-room-id="${r.id}">
                        <div class="hd-room-img" style="${img ? `background-image:url('${img}')` : ""}"></div>
                        <div class="hd-room-body">
                            <div>
                                <h3 class="hd-room-name">${typeLabel}</h3>
                                <div class="hd-room-specs">
                                    <span>⤢ ${r.square || "—"} м²</span>
                                    <span>👥 до ${r.max_place || "—"} гостей</span>
                                </div>
                                ${amenityChipsHtml(r.amenities)}
                            </div>
                            <div class="hd-room-foot">
                                <div class="hd-room-price"><b>${r.price_on_one_day} ₽</b><span> / ночь</span></div>
                                ${isOwner
                            ? `<div class="hd-room-actions">
                                       <button class="btn-small edit-room-btn" data-room-id="${r.id}">✎ Изменить</button>
                                       <button class="btn-small delete-room-btn" data-room-id="${r.id}">🗑 Удалить</button>
                                   </div>`
                            : `<button class="book-btn-small" data-room-id="${r.id}">Выбрать</button>`}
                            </div>
                        </div>
                    </div>`;
                })
                .join("");
        }

        // Card click → room detail modal
        list.querySelectorAll(".room-card-detail").forEach((card) => {
            card.onclick = (e) => {
                if (
                    e.target.closest(".edit-room-btn") ||
                    e.target.closest(".delete-room-btn") ||
                    e.target.closest(".book-btn-small")
                )
                    return;
                const room = rooms.find((r) => r.id == card.getAttribute("data-room-id"));
                showRoomDetailModal(room, hotel, isOwner);
            };
        });

        if (isOwner) {
            list.querySelectorAll(".edit-room-btn").forEach((btn) => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    const room = rooms.find((r) => r.id == btn.getAttribute("data-room-id"));
                    showEditRoomModal(hotel, room);
                };
            });
            list.querySelectorAll(".delete-room-btn").forEach((btn) => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    showDeleteRoomConfirm(hotel, btn.getAttribute("data-room-id"));
                };
            });
        } else {
            list.querySelectorAll(".book-btn-small").forEach((btn) => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    if (!user) {
                        Toast.warning("Необходимо зарегистрироваться, чтобы забронировать");
                        return;
                    }
                    const room = rooms.find((r) => r.id == btn.getAttribute("data-room-id"));
                    showBookingModalForRoom(room, hotel);
                };
            });
        }
    } catch {
        const list = hotelDetailSection.querySelector(".rooms-list");
        if (list) list.textContent = "Ошибка загрузки номеров";
    }

    // ---- Reviews (interactive list) ----
    loadReviews(hotel);
}
