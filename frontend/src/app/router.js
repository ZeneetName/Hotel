import { modal, hideAllSections } from "../shared/ui/dom.js";
import { hideModal } from "../shared/ui/modal.js";
import { hotelApi } from "../entities/hotel/api.js";
import { renderHotels } from "../pages/hotels/index.js";
import { renderProfile } from "../pages/profile/index.js";
import { renderBookings } from "../pages/bookings/index.js";
import { renderHotelDetail } from "../pages/hotel-detail/index.js";
import { renderAuthForm, renderRegisterForm } from "../features/auth/index.js";

// Обработчик кнопок назад/вперед браузера
function handlePopState(event) {
    // Если модальное окно открыто, закрываем его
    if (modal.style.display === "flex") {
        modal.style.display = "none";
        return;
    }

    if (event.state) {
        const { page, hotelId } = event.state;

        switch (page) {
            case "hotels":
                renderHotels(true);
                break;
            case "profile":
                renderProfile(true);
                break;
            case "bookings":
                renderBookings(true);
                break;
            case "login":
                renderAuthForm(true);
                break;
            case "register":
                renderRegisterForm(true);
                break;
            case "hotel":
                if (hotelId) {
                    hotelApi.list().then((hotels) => {
                        const hotel = hotels.find((h) => h.id === hotelId);
                        if (hotel) {
                            renderHotelDetail(hotel, true);
                        } else {
                            renderHotels(true);
                        }
                    });
                }
                break;
            default:
                renderHotels(true);
        }
    } else {
        renderHotels(true);
    }
}

export function initRouter() {
    window.addEventListener("popstate", handlePopState);

    // Обработчик клавиши Escape для закрытия модального окна
    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.style.display === "flex") {
            hideModal();
        }
    });

    // Инициализация - заменяем текущее состояние
    window.history.replaceState({ page: "hotels" }, "", "#hotels");
    renderHotels(true);
}
