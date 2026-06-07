import Http from "../../shared/api/http.js";

export const hotelApi = {
    list() {
        return Http.get("hotels/");
    },
    create(formData) {
        return Http.postForm("hotels/", formData);
    },
    updateWithImages(hotelId, formData) {
        return Http.postForm(`hotels/${hotelId}/`, formData);
    },
    update(hotelId, data) {
        return Http.patch("hotels/", hotelId, data);
    },
    remove(hotelId) {
        return Http.delete("hotels/", hotelId);
    },
};
