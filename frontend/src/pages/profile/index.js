import { showSection, profileSection } from "../../shared/ui/dom.js";
import { pushState } from "../../shared/lib/history.js";
import { loaderHtml } from "../../shared/ui/loader.js";
import { userApi } from "../../entities/user/api.js";
import { logout } from "../../features/auth/index.js";

export async function renderProfile(skipHistory = false) {
    showSection(profileSection);
    if (!skipHistory) pushState({ page: "profile" }, "#profile");
    profileSection.innerHTML = `<div class='profile-container'><h2>Профиль</h2><div class='profile-content'></div><button class='btn logout-btn'>Выйти</button></div>`;
    const content = profileSection.querySelector(".profile-content");
    let isLoaded = false;
    setTimeout(() => {
        if (!isLoaded) {
            content.innerHTML = `Загрузка... ${loaderHtml}`;
        }
    }, 500);
    try {
        const user = await userApi.getProfile();
        isLoaded = true;
        content.innerHTML = "";
        const roleText =
            user.roles === "Admin"
                ? "Администратор"
                : user.roles === "Owner"
                    ? "Владелец"
                    : "Пользователь";
        const avatarInitial = user.full_name.charAt(0).toUpperCase();

        profileSection.querySelector(".profile-content").innerHTML = `
            <div class="profile-layout">
                <div class="profile-left">
                    <div class="profile-avatar-large">${avatarInitial}</div>
                    <h3 class="h3-profile-full_name">${user.full_name}</h3>
                    <div class="profile-role-badge">${roleText}</div>
                </div>
                <div class="profile-right">
                    <div class="profile-info-card">
                        <div class="profile-details">
                            <div class="profile-detail-item">
                                <span class="profile-detail-icon">📧</span>
                                <div class="profile-detail-content">
                                    <span class="profile-detail-label">Email</span>
                                    <span class="profile-detail-value">${user.email || "—"}</span>
                                </div>
                            </div>
                            ${
            user.phone
                ? `
                            <div class="profile-detail-item">
                                <span class="profile-detail-icon">📱</span>
                                <div class="profile-detail-content">
                                    <span class="profile-detail-label">Телефон</span>
                                    <span class="profile-detail-value">${user.phone}</span>
                                </div>
                            </div>
                            `
                : ""
        }
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch {
        profileSection.querySelector(".profile-content").innerHTML =
            "<div style='color: #dc3545;'>Ошибка загрузки профиля</div>";
    }
    profileSection.querySelector(".logout-btn").onclick = logout;
}
