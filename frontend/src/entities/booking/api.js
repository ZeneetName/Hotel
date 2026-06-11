import Http from "../../shared/api/http.js";

export const bookingApi = {
    // Постраничная выдача: возвращает { count, next, previous, results }.
    // search — поиск брони по ID (для админа).
    list(page = 1, search = "") {
        const qs = new URLSearchParams({ page });
        if (search) qs.set("search", search);
        return Http.get(`bookings/?${qs.toString()}`);
    },
    create(roomId, check_in, check_out) {
        return Http.post(`rooms/${roomId}/booking/`, { check_in, check_out });
    },
    // Занятые периоды номера: { data: [{ check_in, check_out }, ...] }.
    busyDates(roomId) {
        return Http.get(`rooms/${roomId}/booking/`);
    },
    update(id, data) {
        return Http.patch("bookings/", id, data);
    },
    remove(id) {
        return Http.delete("bookings/", id);
    },
};
