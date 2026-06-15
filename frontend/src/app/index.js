// Точка входа приложения: связывает виджеты/страницы/фичи и запускает роутер.

import {
    siteTitle,
    btnLogin,
    btnProfile,
    btnBookings,
    btnCreateHotel,
    modal,
    hideAllSections,
} from "../shared/ui/dom.js";
import { hideModal } from "../shared/ui/modal.js";
import { getUser } from "../entities/user/session.js";
import { setHeaderAuth } from "../widgets/header/index.js";
import { enhanceSortSelect } from "../widgets/sort-select/index.js";
import { renderHotels } from "../pages/hotels/index.js";
import { renderProfile } from "../pages/profile/index.js";
import { renderBookings } from "../pages/bookings/index.js";
import { renderAuthForm } from "../features/auth/index.js";
import { showCreateHotelModal } from "../features/hotel-manage/index.js";
import { initRouter } from "./router.js";
import {SVG_hotel} from "../shared/ui/svg/hotel.js"
import Toast from "../shared/ui/toast.js";

const AvatarHotel = document.querySelector(".brand-mark");
AvatarHotel.innerHTML = SVG_hotel

const AvatarHotelFooter = document.querySelector(".footer-brand-mark");
AvatarHotelFooter.innerHTML = SVG_hotel

siteTitle.style.cursor = "pointer";
siteTitle.onclick = () => {
    hideAllSections();
    renderHotels();
};

btnLogin.onclick = renderAuthForm;
btnProfile.onclick = renderProfile;
btnBookings.onclick = renderBookings;
btnCreateHotel.onclick = showCreateHotelModal;

const homeCtaBtn = document.querySelector(".home-cta-btn");
if (homeCtaBtn)
    homeCtaBtn.onclick = () => {
        if (!getUser()) {
            renderAuthForm();
            return;
        }
        showCreateHotelModal();
    };
const homeSearchBtn = document.querySelector(".home-search-btn");
if (homeSearchBtn) {
    const heroEl = document.querySelector(".home-hero");
    const cityInput = heroEl.querySelector('.home-search-field input[type="text"]');
    const [checkInInput, checkOutInput] = heroEl.querySelectorAll(
        '.home-search-field input[type="date"]',
    );
    const sortSelect = document.querySelector(".hotels-sort-select");

    const runHomeSearch = () => {
        const city = cityInput.value.trim();
        const check_in = checkInInput.value;
        const check_out = checkOutInput.value;
        const ordering = sortSelect ? sortSelect.value : "";

        // Даты ищем только парой: либо обе, либо ни одной.
        if ((check_in && !check_out) || (!check_in && check_out)) {
            Toast.warning("Укажите обе даты: заезд и выезд");
            return;
        }
        if (check_in && check_out && new Date(check_out) <= new Date(check_in)) {
            Toast.warning("Дата выезда должна быть позже даты заезда");
            return;
        }

        renderHotels(false, { city, check_in, check_out, ordering, search: true });
    };

    homeSearchBtn.onclick = runHomeSearch;
    cityInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") runHomeSearch();
    });
    checkInInput.addEventListener("change", () => {
        if (checkInInput.value) checkOutInput.min = checkInInput.value;
    });
    if (sortSelect) {
        sortSelect.addEventListener("change", () => {
            const inSearch = document
                .querySelector(".hotels-section")
                ?.classList.contains("search-active");
            if (inSearch) {
                runHomeSearch();
            } else {
                renderHotels(false, { ordering: sortSelect.value });
            }
        });
        enhanceSortSelect(sortSelect);
    }
}

document.querySelectorAll(".footer-nav").forEach((link) => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        const target = link.dataset.nav;
        if (target === "hotels") {
            renderHotels();
            return;
        }
        if (!getUser()) {
            renderAuthForm();
            return;
        }
        if (target === "bookings") renderBookings();
        else if (target === "profile") renderProfile();
    });
});

modal.onclick = (e) => {
    if (e.target === modal) {
        hideModal();
    }
};

window.setHeaderAuth = setHeaderAuth;
setHeaderAuth(!!getUser());

initRouter();
