import { btnLogin, btnProfile, btnBookings, btnCreateHotel } from "../../shared/ui/dom.js";

export function setHeaderAuth(isAuth) {
    btnLogin.style.display = isAuth ? "none" : "inline-block";
    btnProfile.style.display = isAuth ? "inline-block" : "none";
    btnBookings.style.display = isAuth ? "inline-block" : "none";
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const canCreate =
        isAuth && user && (user.roles === "Admin" || user.roles === "Owner");
    btnCreateHotel.style.display = canCreate ? "block" : "none";
}
