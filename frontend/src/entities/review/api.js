import Http, { BASE_URL } from "../../shared/api/http.js";

export const reviewApi = {
    list(hotelId) {
        return Http.get(`hotels/${hotelId}/reviews/`);
    },

    create(hotelId, comment_text, score) {
        return Http.post(`hotels/${hotelId}/reviews/`, { comment_text, score });
    },

    async update(hotelId, reviewId, comment_text, score) {
        try {
            const res = await fetch(
                BASE_URL + `hotels/${hotelId}/reviews/?review_id=${reviewId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        ...Http.getAuthHeaders(),
                    },
                    body: JSON.stringify({ comment_text, score }),
                },
            );
            if (!res.ok) throw new Error("Patch error");
            return await res.json();
        } catch (err) {
            console.error(err);
            throw err;
        }
    },

    async remove(hotelId, reviewId) {
        try {
            const res = await fetch(
                BASE_URL + `hotels/${hotelId}/reviews/?review_id=${reviewId}`,
                {
                    method: "DELETE",
                    headers: { ...Http.getAuthHeaders() },
                },
            );
            if (!res.ok) throw new Error("Delete error");
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    },
};
