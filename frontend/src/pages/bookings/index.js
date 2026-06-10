import { showSection, bookingsSection } from "../../shared/ui/dom.js";
import { showModal, hideModal } from "../../shared/ui/modal.js";
import { modal } from "../../shared/ui/dom.js";
import { pushState } from "../../shared/lib/history.js";
import { loaderHtml } from "../../shared/ui/loader.js";
import { bookingApi } from "../../entities/booking/api.js";
import { getBookingScope } from "../../entities/booking/scope.js";
import Toast from "../../shared/ui/toast.js";
import { renderHotels } from "../hotels/index.js";
import { renderProfile } from "../profile/index.js";

// Красивое русское написание даты: «12 июня 2026».
function fmtDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d)) return value;
    return d.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

// Число ночей между датами (если бэкенд не прислал total_days).
function nights(b) {
    if (b.total_days) return Number(b.total_days);
    if (!b.check_in || !b.check_out) return 0;
    const ms = new Date(b.check_out) - new Date(b.check_in);
    return Math.max(0, Math.round(ms / 86400000));
}

// Статус бронирования по датам относительно сегодня.
function statusOf(b) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ci = b.check_in ? new Date(b.check_in) : null;
    const co = b.check_out ? new Date(b.check_out) : null;
    if (co && co < today) return { key: "past", label: "Завершено" };
    if (ci && co && ci <= today && co >= today)
        return { key: "active", label: "Идёт сейчас" };
    return { key: "upcoming", label: "Предстоит" };
}

const nightsWord = (n) =>
    n % 10 === 1 && n % 100 !== 11
        ? "ночь"
        : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)
          ? "ночи"
          : "ночей";

export async function renderBookings(skipHistory = false) {
    showSection(bookingsSection);
    if (!skipHistory) pushState({ page: "bookings" }, "#bookings");

    const scope = await getBookingScope();
    const subtitle = scope.canManage
        ? scope.isAdmin
            ? "Все бронирования по всем гостиницам"
            : "Бронирования ваших гостиниц"
        : "Все ваши поездки в одном месте";

    bookingsSection.innerHTML = `
        <div class="bookings-page">
            <header class="bookings-head">
                <div>
                    <button class="bookings-eyebrow bookings-to-profile" type="button">← Личный кабинет</button>
                    <h1 class="bookings-title">${scope.label}</h1>
                    <p class="bookings-subtitle">${subtitle}</p>
                </div>
                <button class="btn bookings-explore">＋ Новое бронирование</button>
            </header>
            <div class="bookings-stats" data-stats hidden></div>
            <div class="bookings-list"></div>
            <div class="bookings-sentinel" data-sentinel></div>
        </div>
    `;

    bookingsSection.querySelector(".bookings-explore").onclick = () =>
        renderHotels();
    bookingsSection.querySelector(".bookings-to-profile").onclick = () =>
        renderProfile();

    const list = bookingsSection.querySelector(".bookings-list");
    const statsEl = bookingsSection.querySelector("[data-stats]");
    const sentinel = bookingsSection.querySelector("[data-sentinel]");

    // --- Состояние постраничной загрузки ---
    const loaded = []; // накопленные брони
    let totalCount = 0; // всего броней по данным API
    let nextPage = 1; // следующая страница (null — больше нет)
    let loading = false;
    let firstLoad = true;
    let observer = null;

    const stopObserver = () => {
        if (observer) {
            observer.disconnect();
            observer = null;
        }
    };

    function renderStats() {
        if (!loaded.length) {
            statsEl.hidden = true;
            return;
        }
        const spent = loaded.reduce(
            (sum, b) => sum + (Number(b.total_price) || 0),
            0,
        );
        const upcoming = loaded.filter((b) => statusOf(b).key !== "past").length;
        const spentLabel = scope.canManage
            ? "сумма (загружено)"
            : "потрачено всего";
        const totalLabel = scope.canManage ? "всего броней" : "всего поездок";
        statsEl.hidden = false;
        statsEl.innerHTML = `
            <div class="bookings-stat">
                <span class="bookings-stat-val">${totalCount}</span>
                <span class="bookings-stat-label">${totalLabel}</span>
            </div>
            <div class="bookings-stat">
                <span class="bookings-stat-val">${upcoming}</span>
                <span class="bookings-stat-label">активных и предстоящих</span>
            </div>
            <div class="bookings-stat">
                <span class="bookings-stat-val">${spent.toLocaleString("ru-RU")} ₽</span>
                <span class="bookings-stat-label">${spentLabel}</span>
            </div>`;
    }

    function buildCard(b) {
        const st = statusOf(b);
        const n = nights(b);
        const el = document.createElement("article");
        el.className = `booking-card booking-card--${st.key}`;
        el.dataset.id = b.id;

        const guestHtml =
            scope.canManage && (b.user_name || b.user_email)
                ? `<p class="booking-guest">👤 ${b.user_name || "Гость"}${b.user_email ? ` · ${b.user_email}` : ""}</p>`
                : "";

        const manageHtml = scope.canManage
            ? `<div class="booking-card-actions">
                    <button class="booking-act booking-edit" type="button">✎ Изменить</button>
                    <button class="booking-act booking-del" type="button">🗑 Удалить</button>
               </div>`
            : "";

        el.innerHTML = `
            <div class="booking-card-main">
                <div class="booking-card-top">
                    <h3 class="booking-hotel">${b.hotel_name || "Гостиница"}</h3>
                    <span class="booking-status booking-status--${st.key}">${st.label}</span>
                </div>
                <p class="booking-room">🛏 ${b.room_title || "Номер"}</p>
                ${guestHtml}
                <div class="booking-dates">
                    <div class="booking-date">
                        <span class="booking-date-label">Заезд</span>
                        <span class="booking-date-val">${fmtDate(b.check_in)}</span>
                    </div>
                    <span class="booking-date-arrow">→</span>
                    <div class="booking-date">
                        <span class="booking-date-label">Выезд</span>
                        <span class="booking-date-val">${fmtDate(b.check_out)}</span>
                    </div>
                    ${n ? `<span class="booking-nights">${n} ${nightsWord(n)}</span>` : ""}
                </div>
                <span class="booking-id" title="ID бронирования">ID: ${b.id}</span>
            </div>
            <div class="booking-card-side">
                <span class="booking-price-label">Итого</span>
                <span class="booking-price">${(Number(b.total_price) || 0).toLocaleString("ru-RU")} ₽</span>
                ${manageHtml}
            </div>
        `;

        if (scope.canManage) {
            el.querySelector(".booking-edit").onclick = () =>
                showEditBookingModal(b, el);
            el.querySelector(".booking-del").onclick = () =>
                showDeleteBookingConfirm(b, el);
        }
        return el;
    }

    // Заменяет данные карточки после редактирования.
    function refreshCard(el, updated) {
        const idx = loaded.findIndex((b) => b.id === updated.id);
        if (idx !== -1) loaded[idx] = { ...loaded[idx], ...updated };
        const fresh = buildCard(loaded[idx] || updated);
        el.replaceWith(fresh);
        renderStats();
    }

    function removeCard(el, id) {
        const idx = loaded.findIndex((b) => b.id === id);
        if (idx !== -1) loaded.splice(idx, 1);
        if (totalCount > 0) totalCount -= 1;
        el.remove();
        if (!loaded.length) {
            renderEmpty();
            stopObserver();
        } else {
            renderStats();
        }
    }

    function showEditBookingModal(b, el) {
        showModal(`
            <div class="bk-edit">
                <h2>Изменить бронирование</h2>
                <p class="bk-edit-sub">${b.hotel_name || "Гостиница"} · ${b.room_title || "Номер"}</p>
                <label class="bk-edit-field">Дата заезда
                    <input type="date" class="edit-check-in" value="${b.check_in || ""}">
                </label>
                <label class="bk-edit-field">Дата выезда
                    <input type="date" class="edit-check-out" value="${b.check_out || ""}">
                </label>
                <div class="bk-edit-actions">
                    <button class="btn save-booking-edit">Сохранить</button>
                    <button class="btn close-modal">Отмена</button>
                </div>
            </div>
        `);
        modal.querySelector(".close-modal").onclick = hideModal;
        modal.querySelector(".save-booking-edit").onclick = async () => {
            const check_in = modal.querySelector(".edit-check-in").value;
            const check_out = modal.querySelector(".edit-check-out").value;
            if (!check_in || !check_out) {
                Toast.warning("Укажите обе даты");
                return;
            }
            if (new Date(check_out) <= new Date(check_in)) {
                Toast.warning("Дата выезда должна быть позже даты заезда");
                return;
            }
            try {
                const updated = await bookingApi.update(b.id, {
                    check_in,
                    check_out,
                });
                hideModal();
                Toast.success("Бронирование обновлено");
                refreshCard(el, updated && updated.id ? updated : { ...b, check_in, check_out });
            } catch {
                Toast.error("Не удалось обновить бронирование");
            }
        };
    }

    function showDeleteBookingConfirm(b, el) {
        showModal(`
            <div class="confirm-dialog">
                <div class="confirm-icon">⚠️</div>
                <h2>Удаление брони</h2>
                <p class="confirm-message">Удалить бронирование «${b.room_title || "Номер"}» в «${b.hotel_name || "Гостиница"}»?</p>
                <p class="confirm-warning">Это действие нельзя отменить.</p>
                <div class="confirm-actions">
                    <button class="btn confirm-delete-btn" style="background:#dc3545;">Удалить</button>
                    <button class="btn cancel-delete-btn">Отмена</button>
                </div>
            </div>
        `);
        modal.querySelector(".cancel-delete-btn").onclick = hideModal;
        modal.querySelector(".confirm-delete-btn").onclick = async () => {
            try {
                const ok = await bookingApi.remove(b.id);
                hideModal();
                if (ok) {
                    Toast.success("Бронирование удалено");
                    removeCard(el, b.id);
                } else {
                    Toast.error("Не удалось удалить бронирование");
                }
            } catch {
                hideModal();
                Toast.error("Не удалось удалить бронирование");
            }
        };
    }

    function renderEmpty() {
        statsEl.hidden = true;
        list.innerHTML = `
            <div class="bookings-empty">
                <div class="bookings-empty-ic">${scope.canManage ? "📋" : "🧳"}</div>
                <h3>Бронирований пока нет</h3>
                <p>${scope.canManage ? "Как только гости начнут бронировать, заявки появятся здесь." : "Самое время найти идеальный отель для вашего следующего путешествия."}</p>
                ${scope.canManage ? "" : `<button class="btn bookings-empty-btn">Подобрать отель</button>`}
            </div>`;
        const btn = list.querySelector(".bookings-empty-btn");
        if (btn) btn.onclick = () => renderHotels();
    }

    async function loadNext() {
        if (loading || nextPage == null) return;
        loading = true;
        if (firstLoad) {
            list.innerHTML = `<div class="bookings-loading">Загрузка... ${loaderHtml}</div>`;
        } else {
            sentinel.innerHTML = `<div class="bookings-loading bookings-loading--more">${loaderHtml}</div>`;
        }

        try {
            const res = await bookingApi.list(nextPage);
            const results = res.results || (Array.isArray(res) ? res : []);
            totalCount = res.count != null ? res.count : results.length;

            if (firstLoad) {
                list.innerHTML = "";
                firstLoad = false;
            }

            if (!loaded.length && !results.length) {
                renderEmpty();
                nextPage = null;
                stopObserver();
                return;
            }

            results.forEach((b) => {
                loaded.push(b);
                list.append(buildCard(b));
            });

            nextPage = res.next ? nextPage + 1 : null;
            renderStats();

            if (nextPage == null) stopObserver();
        } catch {
            if (firstLoad) {
                list.innerHTML = `<div class="bookings-empty"><div class="bookings-empty-ic">⚠️</div><h3>Не удалось загрузить</h3><p>Попробуйте обновить страницу позже.</p></div>`;
            }
            nextPage = null;
            stopObserver();
        } finally {
            loading = false;
            sentinel.innerHTML = "";
        }
    }

    // Бесконечная прокрутка: подгружаем следующую страницу, когда виден sentinel.
    observer = new IntersectionObserver(
        (entries) => {
            if (entries.some((e) => e.isIntersecting)) loadNext();
        },
        { rootMargin: "200px" },
    );
    observer.observe(sentinel);

    // Первая загрузка (на случай, если sentinel сразу не пересёкся).
    await loadNext();
}
