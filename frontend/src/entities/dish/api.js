import Http, { BASE_URL } from "../../shared/api/http.js";

export const dishApi = {
    list(hotelId) {
        return Http.get(`dishes/?hotel=${hotelId}`);
    },

    create(hotelId, formData) {
        return Http.postForm(`hotels/${hotelId}/dish/`, formData);
    },

    updateWithImages(dishId, formData) {
        return Http.postForm(`dishes/${dishId}/`, formData);
    },

    async update(dishId, data) {
        try {
            const res = await fetch(BASE_URL + `dishes/${dishId}/`, {
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

    async remove(dishId) {
        try {
            const res = await fetch(BASE_URL + `dishes/${dishId}/`, {
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
