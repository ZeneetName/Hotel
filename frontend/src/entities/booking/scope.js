// Определяет, как пользователь видит раздел бронирований:
//  - обычный гость: «Мои бронирования» (только свои, без управления);
//  - владелец хотя бы одной гостиницы: «Бронирования гостиниц» (брони своих гостиниц,
//    может редактировать/удалять);
//  - администратор: «Бронирования гостиниц» (все брони, бесконечная прокрутка).

import { getUser } from "../user/session.js";
import { hotelApi } from "../hotel/api.js";

export async function getBookingScope() {
    const user = getUser();
    const roles = user && user.roles;
    const isAdmin = roles === "Admin";

    let ownsHotel = false;
    if (user && (roles === "Owner" || isAdmin)) {
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
    return {
        user,
        roles,
        isAdmin,
        // Владелец, у которого есть гостиницы (управляет только своими бронями).
        isOwnerManager: ownsHotel && !isAdmin,
        // Может редактировать/удалять брони из списка.
        canManage: isManager,
        label: isManager ? "Бронирования гостиниц" : "Мои бронирования",
    };
}
