import { modal, hideAllSections } from "../shared/ui/dom.js";
import { hideModal, consumeModalClose } from "../shared/ui/modal.js";
import { hotelApi } from "../entities/hotel/api.js";
import { renderHotels } from "../pages/hotels/index.js";
import { renderProfile } from "../pages/profile/index.js";
import { renderBookings } from "../pages/bookings/index.js";
import { renderHotelDetail } from "../pages/hotel-detail/index.js";
import { renderAuthForm, renderRegisterForm } from "../features/auth/index.js";

function handlePopState(event) {
    // Закрытие модалки кнопкой/Escape/Отмена: запись из истории убрана,
    // страницу под модалкой НЕ перерисовываем — остаёмся на месте.
    if (consumeModalClose()) {
        return;
    }

    // Закрытие модалки браузерной кнопкой «Назад»
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

// Восстановление страницы по текущему хэшу URL (при обновлении страницы F5)
function restoreFromHash() {
    const hash = window.location.hash.replace(/^#/, "");
    const [page, param] = hash.split("/");

    switch (page) {
        case "profile":
            window.history.replaceState({ page: "profile" }, "", "#profile");
            renderProfile(true);
            break;
        case "bookings":
            window.history.replaceState({ page: "bookings" }, "", "#bookings");
            renderBookings(true);
            break;
        case "login":
            window.history.replaceState({ page: "login" }, "", "#login");
            renderAuthForm(true);
            break;
        case "register":
            window.history.replaceState({ page: "register" }, "", "#register");
            renderRegisterForm(true);
            break;
        case "hotel": {
            const hotelId = Number(param);
            if (hotelId) {
                window.history.replaceState(
                    { page: "hotel", hotelId },
                    "",
                    `#hotel/${hotelId}`,
                );
                hotelApi.list().then((hotels) => {
                    const hotel = hotels.find((h) => h.id === hotelId);
                    if (hotel) {
                        renderHotelDetail(hotel, true);
                    } else {
                        window.history.replaceState(
                            { page: "hotels" },
                            "",
                            "#hotels",
                        );
                        renderHotels(true);
                    }
                });
                break;
            }
            // fallthrough к hotels при отсутствии id
        }
        // eslint-disable-next-line no-fallthrough
        case "hotels":
        default:
            window.history.replaceState({ page: "hotels" }, "", "#hotels");
            renderHotels(true);
    }
}

export function initRouter() {
    window.addEventListener("popstate", handlePopState);

    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.style.display === "flex") {
            hideModal();
        }
    });

    restoreFromHash();
}
