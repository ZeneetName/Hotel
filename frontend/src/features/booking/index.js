import { showModal, hideModal } from "../../shared/ui/modal.js";
import { modal } from "../../shared/ui/dom.js";
import Toast from "../../shared/ui/toast.js";
import { bookingApi } from "../../entities/booking/api.js";
import { roomApi } from "../../entities/room/api.js";
import { SVG_people } from "../../shared/ui/svg/people.js";

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
                <div class="bk-cal" data-cal>
                    <div class="bk-cal-head">
                        <button type="button" class="bk-cal-nav bk-cal-prev" aria-label="Предыдущий месяц">‹</button>
                        <span class="bk-cal-month">—</span>
                        <button type="button" class="bk-cal-nav bk-cal-next" aria-label="Следующий месяц">›</button>
                    </div>
                    <div class="bk-cal-week"><span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span></div>
                    <div class="bk-cal-grid"></div>
                    <div class="bk-cal-legend">
                        <span class="bk-cal-lg"><i class="bk-cal-dot bk-cal-dot--free"></i>Свободно</span>
                        <span class="bk-cal-lg"><i class="bk-cal-dot bk-cal-dot--busy"></i>Занято</span>
                    </div>
                    <div class="bk-cal-selected">
                        <span>Заезд: <b class="bk-cal-in">—</b></span>
                        <span>Выезд: <b class="bk-cal-out">—</b></span>
                    </div>
                </div>
                <div class="bk-cell bk-cell-top">
                    <label>Гости</label>
                    <div class="bk-guests-row">
                        <div class="bk-cell-row"><span class="bk-ic">${SVG_people}</span><span class="bk-guests-count">1 ${guestWord(1)}</span></div>
                        <div class="bk-stepper">
                            <button type="button" class="bk-step bk-minus">−</button>
                            <span class="bk-guests-num">1</span>
                            <button type="button" class="bk-step bk-plus">+</button>
                        </div>
                    </div>
                </div>
            </div>

            <input type="hidden" class="date-from">
            <input type="hidden" class="date-to">

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
    // --- Кастомный календарь с подсветкой занятых дат ---
    const calRoot = modal.querySelector("[data-cal]");
    const grid = calRoot.querySelector(".bk-cal-grid");
    const monthLabel = calRoot.querySelector(".bk-cal-month");
    const inLabel = calRoot.querySelector(".bk-cal-in");
    const outLabel = calRoot.querySelector(".bk-cal-out");

    const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    // Локальная дата → "YYYY-MM-DD" (без сдвига по часовому поясу).
    const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const parseISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const busy = new Set();              // занятые дни "YYYY-MM-DD"
    let view = new Date(monthStart);     // отображаемый месяц
    let selFrom = null;                  // выбранный заезд (Date)
    let selTo = null;                    // выбранный выезд (Date)

    // Есть ли занятый день в полуинтервале [a, b)
    const hasBusyBetween = (a, b) => {
        const c = new Date(a);
        while (c < b) {
            if (busy.has(iso(c))) return true;
            c.setDate(c.getDate() + 1);
        }
        return false;
    };

    const syncSelection = () => {
        fromEl.value = selFrom ? iso(selFrom) : "";
        toEl.value = selTo ? iso(selTo) : "";
        inLabel.textContent = selFrom ? selFrom.toLocaleDateString("ru-RU") : "—";
        outLabel.textContent = selTo ? selTo.toLocaleDateString("ru-RU") : "—";
        recalc();
    };

    const pick = (day) => {
        if (!selFrom || selTo || day <= selFrom) {
            // начинаем выбор заново с заезда
            selFrom = day;
            selTo = null;
        } else if (hasBusyBetween(selFrom, day)) {
            // нельзя перепрыгнуть занятые дни — начинаем заново
            selFrom = day;
            selTo = null;
        } else {
            selTo = day;
        }
        syncSelection();
        render();
    };

    function render() {
        monthLabel.textContent = `${MONTHS[view.getMonth()]} ${view.getFullYear()}`;
        grid.innerHTML = "";
        const lead = (new Date(view.getFullYear(), view.getMonth(), 1).getDay() + 6) % 7; // Пн — первый
        const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
        for (let i = 0; i < lead; i++) {
            const sp = document.createElement("span");
            sp.className = "bk-cal-day bk-cal-day--empty";
            grid.append(sp);
        }
        for (let d = 1; d <= days; d++) {
            const date = new Date(view.getFullYear(), view.getMonth(), d);
            const key = iso(date);
            const cell = document.createElement("button");
            cell.type = "button";
            cell.className = "bk-cal-day";
            cell.textContent = d;
            const isPast = date < today;
            const isBusy = busy.has(key);
            if (isPast) cell.classList.add("bk-cal-day--past");
            if (isBusy) cell.classList.add("bk-cal-day--busy");
            if (selFrom && key === iso(selFrom)) cell.classList.add("bk-cal-day--from");
            if (selTo && key === iso(selTo)) cell.classList.add("bk-cal-day--to");
            if (selFrom && selTo && date > selFrom && date < selTo) cell.classList.add("bk-cal-day--inrange");
            if (isPast || isBusy) {
                cell.disabled = true;
            } else {
                cell.onclick = () => pick(date);
            }
            grid.append(cell);
        }
    }

    calRoot.querySelector(".bk-cal-prev").onclick = () => {
        const m = new Date(view.getFullYear(), view.getMonth() - 1, 1);
        if (m >= monthStart) { view = m; render(); } // не листаем в прошлое
    };
    calRoot.querySelector(".bk-cal-next").onclick = () => {
        view = new Date(view.getFullYear(), view.getMonth() + 1, 1);
        render();
    };

    render();

    // Подгружаем занятые периоды и помечаем дни.
    bookingApi
        .busyDates(room.id)
        .then((res) => {
            const ranges = res.data || res.results || (Array.isArray(res) ? res : []);
            ranges.forEach((r) => {
                if (!r.check_in || !r.check_out) return;
                const end = parseISO(r.check_out); // день выезда свободен
                const c = parseISO(r.check_in);
                while (c < end) {
                    busy.add(iso(c));
                    c.setDate(c.getDate() + 1);
                }
            });
            render();
        })
        .catch(() => {});

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
