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
import { renderHotels } from "../pages/hotels/index.js";
import { renderProfile } from "../pages/profile/index.js";
import { renderBookings } from "../pages/bookings/index.js";
import { renderAuthForm } from "../features/auth/index.js";
import { showCreateHotelModal } from "../features/hotel-manage/index.js";
import { initRouter } from "./router.js";

// --- Навигация ---
siteTitle.style.cursor = "pointer";
siteTitle.onclick = () => {
    hideAllSections();
    renderHotels();
};

btnLogin.onclick = renderAuthForm;
btnProfile.onclick = renderProfile;
btnBookings.onclick = renderBookings;
btnCreateHotel.onclick = showCreateHotelModal;

// Маркетинговый CTA «Добавить жильё» на главной — тот же поток создания.
// Неавторизованного гостя сначала отправляем на аутентификацию.
const homeCtaBtn = document.querySelector(".home-cta-btn");
if (homeCtaBtn)
    homeCtaBtn.onclick = () => {
        if (!getUser()) {
            renderAuthForm();
            return;
        }
        showCreateHotelModal();
    };
modal.onclick = (e) => {
    if (e.target === modal) {
        hideModal();
    }
};

// Совместимость: доступ к setHeaderAuth из других частей кода
window.setHeaderAuth = setHeaderAuth;
setHeaderAuth(!!getUser());

initRouter();
