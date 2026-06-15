// Определяет, как пользователь видит раздел бронирований:
//  - обычный гость: «Мои бронирования» (только свои, без управления);
//  - владелец хотя бы одной гостиницы: «Бронирования гостиниц» (брони своих гостиниц,
//    может редактировать/удалять);
//  - администратор: «Бронирования гостиниц» (все брони, бесконечная прокрутка).
//
// Чтобы не дёргать бэкенд при каждом обновлении страницы, результат кэшируется
// в localStorage (привязан к id пользователя). На рефреше берём готовый scope из
// кэша — запрос к серверу делается только при первом расчёте или при force
// (логин/логаут/создание/удаление гостиницы кэш сбрасывают).

import { getUser } from "../user/session.js";
import { hotelApi } from "../hotel/api.js";

const SCOPE_CACHE_KEY = "booking_scope";

function guestScope() {
    return {
        user: null,
        roles: null,
        isAdmin: false,
        isOwnerManager: false,
        canManage: false,
        label: "Мои бронирования",
    };
}

function readCache(userId) {
    try {
        const raw = localStorage.getItem(SCOPE_CACHE_KEY);
        if (!raw) return null;
        const cached = JSON.parse(raw);
        return cached && cached.userId === userId ? cached.scope : null;
    } catch {
        return null;
    }
}

function writeCache(userId, scope) {
    try {
        localStorage.setItem(
            SCOPE_CACHE_KEY,
            JSON.stringify({ userId, scope }),
        );
    } catch {
        /* localStorage недоступен — просто не кэшируем */
    }
}

export function clearBookingScopeCache() {
    localStorage.removeItem(SCOPE_CACHE_KEY);
}

export async function getBookingScope({ force = false } = {}) {
    const user = getUser();
    if (!user) return guestScope();

    if (!force) {
        const cached = readCache(user.id);
        if (cached) return { ...cached, user };
    }

    const roles = user.roles;
    const isAdmin = roles === "Admin";

    let ownsHotel = false;
    if (roles === "Owner" || isAdmin) {
        try {
            const hotels = await hotelApi.list();
            ownsHotel =
                Array.isArray(hotels) &&
                hotels.some((h) => String(h.owner) === String(user.id));
        } catch {
            ownsHotel = false;
        }
    }

    const isManager = isAdmin || ownsHotel;
    const scope = {
        roles,
        isAdmin,
        // Владелец, у которого есть гостиницы (управляет только своими бронями).
        isOwnerManager: ownsHotel && !isAdmin,
        // Может редактировать/удалять брони из списка.
        canManage: isManager,
        label: isManager ? "Бронирования гостиниц" : "Мои бронирования",
    };
    writeCache(user.id, scope);
    return { ...scope, user };
}
