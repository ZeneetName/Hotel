import Http from "../../shared/api/http.js";

export const hotelApi = {
    // params: { city, check_in, check_out } — поиск по городу и свободным датам.
    list(params = {}) {
        const qs = new URLSearchParams();
        if (params.city) qs.set("city", params.city);
        if (params.check_in) qs.set("check_in", params.check_in);
        if (params.check_out) qs.set("check_out", params.check_out);
        if (params.ordering) qs.set("ordering", params.ordering);
        const query = qs.toString();
        return Http.get(`hotels/${query ? `?${query}` : ""}`);
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
