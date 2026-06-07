import { showModal, hideModal } from "../../shared/ui/modal.js";
import { modal } from "../../shared/ui/dom.js";
import Toast from "../../shared/ui/toast.js";
import { bookingApi } from "../../entities/booking/api.js";
import { roomApi } from "../../entities/room/api.js";

export function showBookingModalForRoom(room, hotel) {
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
            await bookingApi.create(room.id, check_in, check_out);
            hideModal();
            Toast.success("Бронирование успешно!");
        } catch (err) {
            Toast.error(
                "Ошибка бронирования. Возможно, номер уже забронирован",
            );
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
