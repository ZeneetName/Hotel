// Хранение текущей сессии пользователя: токен — в cookie, профиль — в localStorage.

import { getCookie, setCookie, deleteCookie } from "../../shared/lib/cookie.js";

const TOKEN_KEY = "token";

export function getToken() {
    let token = getCookie(TOKEN_KEY);
    // Бесшовная миграция со старого хранения токена в localStorage.
    if (!token) {
        const legacy = localStorage.getItem(TOKEN_KEY);
        if (legacy) {
            setCookie(TOKEN_KEY, legacy);
            localStorage.removeItem(TOKEN_KEY);
            token = legacy;
        }
    }
    return token;
}

export function getUser() {
    return getToken()
        ? JSON.parse(localStorage.getItem("user") || "{}")
        : null;
}

export function setCurrentUser(user, token) {
    if (user && token) {
        localStorage.setItem("user", JSON.stringify(user));
        setCookie(TOKEN_KEY, token);
        // Новый вход — сбрасываем закэшированный scope бронирований,
        // чтобы он пересчитался под этого пользователя.
        localStorage.removeItem("booking_scope");
    }
}

export function clearSession() {
    localStorage.removeItem("user");
    deleteCookie(TOKEN_KEY);
    localStorage.removeItem("booking_scope");
}
