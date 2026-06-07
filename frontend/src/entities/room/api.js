import Http from "../../shared/api/http.js";

export const roomApi = {
    list(hotelId) {
        return Http.get(`hotels/${hotelId}/room/`);
    },
    create(hotelId, formData) {
        return Http.postForm(`hotels/${hotelId}/room/`, formData);
    },
    updateWithImages(roomId, formData) {
        return Http.postForm(`rooms/${roomId}/`, formData);
    },
    update(roomId, data) {
        return Http.patch("rooms/", roomId, data);
    },
    remove(roomId) {
        return Http.delete("rooms/", roomId);
    },
};
