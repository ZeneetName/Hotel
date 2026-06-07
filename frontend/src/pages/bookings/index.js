import { showSection, bookingsSection } from "../../shared/ui/dom.js";
import { pushState } from "../../shared/lib/history.js";
import { loaderHtml } from "../../shared/ui/loader.js";
import { bookingApi } from "../../entities/booking/api.js";

export async function renderBookings(skipHistory = false) {
    showSection(bookingsSection);
    if (!skipHistory) pushState({ page: "bookings" }, "#bookings");
    bookingsSection.innerHTML =
        `<h2>Мои бронирования</h2><div class='bookings-list'></div>`;

    const list = bookingsSection.querySelector(".bookings-list");
    let isLoaded = false;
    setTimeout(() => {
        if (!isLoaded) {
            list.innerHTML = `Загрузка... ${loaderHtml}`;
        }
    }, 500);

    try {
        const bookings = await bookingApi.list();
        isLoaded = true;
        list.innerHTML = "";
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
