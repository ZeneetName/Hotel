import { showModal, hideModal } from "../../shared/ui/modal.js";
import { modal } from "../../shared/ui/dom.js";
import Toast from "../../shared/ui/toast.js";
import { bookingApi } from "../../entities/booking/api.js";
import { roomApi } from "../../entities/room/api.js";

const fmtRub = (n) => `${Math.round(n).toLocaleString("ru-RU")} ₽`;
const guestWord = (n) => (n === 1 ? "гость" : n >= 2 && n <= 4 ? "гостя" : "гостей");
const nightWord = (n) => (n === 1 ? "ночь" : n >= 2 && n <= 4 ? "ночи" : "ночей");

export function showBookingModalForRoom(room, hotel) {
    const roomLabel = room.type === "standard" ? "Стандартный номер" : "Люкс номер";
    const price = Number(room.price_on_one_day) || 0;
    const maxPlace = Number(room.max_place) || 1;
    const img = room.room_images ? room.room_images.replace("http://localhost", "") : "";

    showModal(`
        <div class="bk">
            <div class="bk-head">
                <h2 class="bk-title">Бронирование</h2>
                <p class="bk-sub">${roomLabel} · ${hotel.title}</p>
            </div>

            <div class="bk-preview">
                <div class="bk-preview-img" style="${img ? `background-image:url('${img}')` : ""}"></div>
                <div class="bk-preview-info">
                    <p class="bk-preview-name">${roomLabel}</p>
                    <p class="bk-preview-meta">${room.square || "—"} м² · до ${maxPlace} ${guestWord(maxPlace)}</p>
                    <p class="bk-preview-price">${fmtRub(price)} <span>/ ночь</span></p>
                </div>
            </div>

            <div class="bk-box">
                <div class="bk-box-dates">
                    <div class="bk-cell">
                        <label>Заезд</label>
                        <div class="bk-cell-row"><span class="bk-ic">📅</span><input type="date" class="date-from"></div>
                    </div>
                    <div class="bk-cell bk-cell-divider">
                        <label>Выезд</label>
                        <div class="bk-cell-row"><span class="bk-ic">📅</span><input type="date" class="date-to"></div>
                    </div>
                </div>
                <div class="bk-cell bk-cell-top">
                    <label>Гости</label>
                    <div class="bk-guests-row">
                        <div class="bk-cell-row"><span class="bk-ic">👥</span><span class="bk-guests-count">1 ${guestWord(1)}</span></div>
                        <div class="bk-stepper">
                            <button type="button" class="bk-step bk-minus">−</button>
                            <span class="bk-guests-num">1</span>
                            <button type="button" class="bk-step bk-plus">+</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bk-breakdown" style="display:none">
                <div class="bk-bd-row"><span class="bk-bd-line"></span><span class="bk-bd-sum"></span></div>
                <div class="bk-bd-row"><span>Налоги и сборы (12%)</span><span class="bk-bd-tax"></span></div>
                <div class="bk-bd-row bk-bd-total"><span>Итого</span><span class="bk-bd-grand"></span></div>
            </div>

            <button class="btn bk-submit confirm-booking" disabled>Выберите даты</button>
            <p class="bk-note">Бесплатная отмена до 48 часов до заезда</p>
        </div>
    `);

    const fromEl = modal.querySelector(".date-from");
    const toEl = modal.querySelector(".date-to");
    const breakdown = modal.querySelector(".bk-breakdown");
    const submit = modal.querySelector(".confirm-booking");

    // Счётчик гостей (визуальный, ограничен вместимостью номера)
    let guests = 1;
    const guestsNum = modal.querySelector(".bk-guests-num");
    const guestsCount = modal.querySelector(".bk-guests-count");
    const renderGuests = () => {
        guestsNum.textContent = guests;
        guestsCount.textContent = `${guests} ${guestWord(guests)}`;
    };
    modal.querySelector(".bk-minus").onclick = () => { guests = Math.max(1, guests - 1); renderGuests(); };
    modal.querySelector(".bk-plus").onclick = () => { guests = Math.min(maxPlace, guests + 1); renderGuests(); };

    const nightsBetween = () => {
        if (!fromEl.value || !toEl.value) return 0;
        const ms = new Date(toEl.value) - new Date(fromEl.value);
        return Math.max(0, Math.round(ms / 86400000));
    };

    const recalc = () => {
        const nights = nightsBetween();
        if (nights > 0) {
            const total = nights * price;
            const tax = Math.round(total * 0.12);
            breakdown.style.display = "flex";
            modal.querySelector(".bk-bd-line").textContent = `${fmtRub(price)} × ${nights} ${nightWord(nights)}`;
            modal.querySelector(".bk-bd-sum").textContent = fmtRub(total);
            modal.querySelector(".bk-bd-tax").textContent = fmtRub(tax);
            modal.querySelector(".bk-bd-grand").textContent = fmtRub(total + tax);
            submit.disabled = false;
            submit.textContent = `Забронировать · ${fmtRub(total + tax)}`;
        } else {
            breakdown.style.display = "none";
            submit.disabled = true;
            submit.textContent = "Выберите даты";
        }
    };
    fromEl.onchange = recalc;
    toEl.onchange = recalc;

    submit.onclick = async () => {
        const check_in = fromEl.value;
        const check_out = toEl.value;
        if (!check_in || !check_out) {
            Toast.warning("Заполните даты");
            return;
        }
        try {
            await bookingApi.create(room.id, check_in, check_out);
            // Success-экран
            modal.querySelector(".modal-content").innerHTML = `
                <button class="modal-x" aria-label="Закрыть" title="Закрыть">✕</button>
                <div class="bk-success">
                    <div class="bk-success-ic">✓</div>
                    <h2 class="bk-title">Бронирование подтверждено!</h2>
                    <p class="bk-sub">${roomLabel} · ${nightsBetween()} ${nightWord(nightsBetween())}</p>
                    <p class="bk-success-dates">Заезд: ${new Date(check_in).toLocaleDateString("ru-RU")} — Выезд: ${new Date(check_out).toLocaleDateString("ru-RU")}</p>
                    <button class="btn bk-success-close">Закрыть</button>
                </div>
            `;
            modal.querySelector(".modal-x").onclick = hideModal;
            modal.querySelector(".bk-success-close").onclick = hideModal;
            Toast.success("Бронирование успешно!");
        } catch (err) {
            Toast.error("Ошибка бронирования. Возможно, номер уже забронирован");
        }
    };
}

export async function showBookingModal(hotel) {
    showModal(
        `<h2>Бронирование: ${hotel.title}</h2><div class="rooms-list"></div>`,
    );
    let rooms = [];
    try {
        const res = await roomApi.list(hotel.id);
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
            await bookingApi.create(roomId, check_in, check_out);
            hideModal();
            Toast.success("Бронирование успешно!");
        } catch (err) {
            Toast.error(
                "Ошибка бронирования. Возможно, номер уже забронирован",
            );
        }
    };
}
