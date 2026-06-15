// Небольшие помощники для работы с cookie (для хранения токена авторизации).
// SameSite=Lax защищает от CSRF при межсайтовых переходах; флаг Secure
// добавляется автоматически на HTTPS.

function attrs() {
    const secure = location.protocol === "https:" ? "; Secure" : "";
    return `; path=/; SameSite=Lax${secure}`;
}

export function setCookie(name, value, days = 7) {
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAge}${attrs()}`;
}

export function getCookie(name) {
    const prefix = name + "=";
    const parts = document.cookie ? document.cookie.split("; ") : [];
    for (const part of parts) {
        if (part.startsWith(prefix)) {
            return decodeURIComponent(part.slice(prefix.length));
        }
    }
    return null;
}

export function deleteCookie(name) {
    document.cookie = `${name}=; max-age=0${attrs()}`;
}
