// Хранение текущей сессии пользователя в localStorage.

export function getUser() {
    return localStorage.getItem("token")
        ? JSON.parse(localStorage.getItem("user") || "{}")
        : null;
}

export function setCurrentUser(user, token) {
    if (user && token) {
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", token);
    }
}

export function clearSession() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
}
