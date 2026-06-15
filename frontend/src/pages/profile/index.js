import { showSection, profileSection } from "../../shared/ui/dom.js";
import { pushState } from "../../shared/lib/history.js";
import { loaderHtml } from "../../shared/ui/loader.js";
import { userApi } from "../../entities/user/api.js";
import { logout } from "../../features/auth/index.js";
import { renderBookings } from "../bookings/index.js";
import { renderHotels } from "../hotels/index.js";
import { getBookingScope } from "../../entities/booking/scope.js";
import { SVG_mail } from "../../shared/ui/svg/mail.js";
import { SVG_mobile } from "../../shared/ui/svg/mobile.js";
import { SVG_warning } from "../../shared/ui/svg/warning.js";
import { escapeHtml } from "../../shared/lib/escape-html.js";

const ROLE_LABELS = {
    Admin: "Администратор",
    Owner: "Владелец жилья",
};

export async function renderProfile(skipHistory = false) {
    showSection(profileSection);
    if (!skipHistory) pushState({ page: "profile" }, "#profile");

    profileSection.innerHTML = `<div class="profile-page"><div class="profile-content"></div></div>`;
    const content = profileSection.querySelector(".profile-content");

    let isLoaded = false;
    setTimeout(() => {
        if (!isLoaded) {
            content.innerHTML = `<div class="profile-loading">Загрузка... ${loaderHtml}</div>`;
        }
    }, 500);

    try {
        const user = await userApi.getProfile();
        isLoaded = true;

        const roleText = ROLE_LABELS[user.roles] || "Гость";
        const name = user.full_name || "Пользователь";
        const avatarInitial = name.charAt(0).toUpperCase();

        content.innerHTML = `
            <div class="profile-cover">
                <button class="profile-back-hotels" type="button">← Вернуться к просмотру гостиниц</button>
                <button class="profile-logout">⎋ Выйти</button>
            </div>
            <div class="profile-card">
                <div class="profile-card-head">
                    <div class="profile-avatar-large">${escapeHtml(avatarInitial)}</div>
                    <h2 class="profile-name">${escapeHtml(name)}</h2>
                    <div class="profile-role-badge">${roleText}</div>
                </div>

                <div class="profile-grid">
                    <div class="profile-detail-item">
                        <span class="profile-detail-icon">${SVG_mail}</span>
                        <div class="profile-detail-content">
                            <span class="profile-detail-label">Email</span>
                            <span class="profile-detail-value">${escapeHtml(user.email) || "—"}</span>
                        </div>
                    </div>
                    <div class="profile-detail-item">
                        <span class="profile-detail-icon">${SVG_mobile}</span>
                        <div class="profile-detail-content">
                            <span class="profile-detail-label">Телефон</span>
                            <span class="profile-detail-value">${escapeHtml(user.phone) || "Не указан"}</span>
                        </div>
                    </div>
                </div>

                <div class="profile-actions">
                    <button class="profile-action profile-action--primary profile-to-bookings">
                        <span class="profile-action-ic"> </span>
                        <span>
                            <b class="profile-bookings-label">Мои бронирования</b>
                            <small class="profile-bookings-hint">Посмотреть историю поездок</small>
                        </span>
                        <span class="profile-action-arrow">→</span>
                    </button>
                </div>
            </div>
        `;

        content.querySelector(".profile-logout").onclick = logout;
        content.querySelector(".profile-back-hotels").onclick = () =>
            renderHotels();
        content.querySelector(".profile-to-bookings").onclick = () =>
            renderBookings();


        getBookingScope().then((scope) => {
            if (scope.canManage) {
                const lbl = content.querySelector(".profile-bookings-label");
                const hint = content.querySelector(".profile-bookings-hint");
                if (lbl) lbl.textContent = scope.label;
                if (hint)
                    hint.textContent = scope.isAdmin
                        ? "Все брони по всем гостиницам"
                        : "Брони ваших гостиниц";
            }
        });
    } catch {
        isLoaded = true;
        content.innerHTML = `
            <div class="profile-card profile-card--error">
                <div class="bookings-empty-ic">${SVG_warning}</div>
                <h3>Не удалось загрузить профиль</h3>
                <p>Попробуйте обновить страницу позже.</p>
                <button class="btn profile-logout">Выйти</button>
            </div>`;
        content.querySelector(".profile-logout").onclick = logout;
    }
}
