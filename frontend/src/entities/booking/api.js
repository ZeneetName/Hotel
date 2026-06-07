import Http from "../../shared/api/http.js";

export const bookingApi = {
    list() {
        return Http.get("bookings/");
    },
    create(roomId, check_in, check_out) {
        return Http.post(`rooms/${roomId}/booking/`, { check_in, check_out });
    },
};
