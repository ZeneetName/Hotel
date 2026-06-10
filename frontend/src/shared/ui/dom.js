// Общие ссылки на корневые DOM-узлы каркаса (index.html) и переключение секций.

export const hotelsList = document.querySelector(".hotels-list");
export const authSection = document.querySelector(".auth-section");
export const profileSection = document.querySelector(".profile-section");
export const bookingsSection = document.querySelector(".bookings-section");
export const hotelDetailSection = document.querySelector(".hotel-detail-section");
export const header = document.querySelector(".header");
export const btnLogin = document.querySelector(".login");
export const btnProfile = document.querySelector(".profile");
export const btnBookings = document.querySelector(".my-bookings");
export const btnCreateHotel = document.querySelector(".create-hotel-btn");
export const modal = document.querySelector(".modal");
export const siteTitle = document.querySelector(".site-title");
export const siteFooter = document.querySelector(".site-footer");

export function showSection(section) {
    [authSection, profileSection, bookingsSection, hotelDetailSection].forEach(
        (s) => (s.style.display = "none"),
    );
    const hotelsSection = document.querySelector(".hotels-section");
    hotelsSection.style.display =
        section === hotelDetailSection ||
        section === authSection ||
        section === profileSection ||
        section === bookingsSection
            ? "none"
            : "block";
    section.style.display = "block";

    if (section === hotelDetailSection) {
        section.style.display = "flex";
        header.style.display = "none";
    } else if (section === authSection) {
        // Авторизация/регистрация — полноэкранный режим без шапки и футера.
        section.style.display = "block";
        header.style.display = "none";
    } else if (section === profileSection) {
        section.style.display = "flex";
        header.style.display = "flex";
    } else {
        section.style.display = "block";
        header.style.display = "flex";
    }

    // Футер скрываем только на страницах входа/регистрации.
    if (siteFooter) siteFooter.style.display = section === authSection ? "none" : "block";
}

export function hideAllSections() {
    [authSection, profileSection, bookingsSection, hotelDetailSection].forEach(
        (s) => (s.style.display = "none"),
    );
    document.querySelector(".hotels-section").style.display = "block";
    header.style.display = "flex";
    if (siteFooter) siteFooter.style.display = "block";
}
