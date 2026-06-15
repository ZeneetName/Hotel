import { btnLogin, btnProfile, btnBookings, btnCreateHotel } from "../../shared/ui/dom.js";
import { getBookingScope } from "../../entities/booking/scope.js";

export function setHeaderAuth(isAuth) {
    btnLogin.style.display = isAuth ? "none" : "inline-block";
    btnProfile.style.display = isAuth ? "inline-block" : "none";
    btnBookings.style.display = isAuth ? "inline-block" : "none";
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const canCreate =
        isAuth && user && (user.roles === "Admin" || user.roles === "Owner");
    btnCreateHotel.style.display = canCreate ? "block" : "none";

    // Блок-призыв «Есть своя гостиница? Добавить жильё» виден только тем, кто
    // может размещать жильё (владелец/админ). За роль «клиент» блока нет совсем
    // (по умолчанию скрыт в CSS, показывается только с классом can-post-housing).
    document.body.classList.toggle("can-post-housing", canCreate);

    if (isAuth) {
        getBookingScope().then((scope) => {
            btnBookings.textContent = `${scope.label}`;
        });
    } else {
        btnBookings.textContent = "Мои бронирования";
    }
}
