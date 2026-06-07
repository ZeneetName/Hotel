import Http, { BASE_URL } from "../../shared/api/http.js";

export const serviceApi = {
    list(hotelId) {
        return Http.get(`services/?hotel=${hotelId}`);
    },

    create(hotelId, formData) {
        return Http.postForm(`hotels/${hotelId}/service/`, formData);
    },

    updateWithImages(serviceId, formData) {
        return Http.postForm(`services/${serviceId}/`, formData);
    },

    async update(serviceId, data) {
        try {
            const res = await fetch(BASE_URL + `services/${serviceId}/`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...Http.getAuthHeaders(),
                },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Patch error");
            return await res.json();
        } catch (err) {
            console.error(err);
            throw err;
        }
    },

    async remove(serviceId) {
        try {
            const res = await fetch(BASE_URL + `services/${serviceId}/`, {
                method: "DELETE",
                headers: { ...Http.getAuthHeaders() },
            });
            if (!res.ok) throw new Error("Delete error");
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    },
};
