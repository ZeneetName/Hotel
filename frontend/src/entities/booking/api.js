import Http from "../../shared/api/http.js";

export const bookingApi = {
    // Постраничная выдача: возвращает { count, next, previous, results }.
    list(page = 1) {
        return Http.get(`bookings/?page=${page}`);
    },
    create(roomId, check_in, check_out) {
        return Http.post(`rooms/${roomId}/booking/`, { check_in, check_out });
    },
    update(id, data) {
        return Http.patch("bookings/", id, data);
    },
    remove(id) {
        return Http.delete("bookings/", id);
    },
};
