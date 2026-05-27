const BASE_URL = "/api/";

class API {
    static getAuthHeaders() {
        const token = localStorage.getItem("token");
        return token ? { Authorization: `Token ${token}` } : {};
    }

    static async get(url) {
        try {
            const res = await fetch(BASE_URL + url, {
                headers: { ...this.getAuthHeaders() },
            });
            if (!res.ok) throw new Error("Fetch error");
            return await res.json();
        } catch (err) {
            console.error(err);
            return [];
        }
    }

    static async postForm(url, formData) {
        const res = await fetch(BASE_URL + url, {
            method: "POST",
            headers: { ...this.getAuthHeaders() },
            body: formData,
        });
        const json = await res.json();
        if (!res.ok) {
            console.error("PostForm error", json);
            throw json;
        }
        return json;
    }

    static async post(url, data = {}) {
        const res = await fetch(BASE_URL + url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...this.getAuthHeaders(),
            },
            body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!res.ok) {
            console.error("Post error", json);
            throw json;
        }
        return json;
    }

    static async put(url, id, data = {}) {
        try {
            const res = await fetch(BASE_URL + url + id + "/", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...this.getAuthHeaders(),
                },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Put error");
            return await res.json();
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

    static async patch(url, id, data = {}) {
        try {
            const res = await fetch(BASE_URL + url + id + "/", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...this.getAuthHeaders(),
                },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Patch error");
            return await res.json();
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

    static async delete(url, id) {
        try {
            const res = await fetch(BASE_URL + url + id + "/", {
                method: "DELETE",
                headers: { ...this.getAuthHeaders() },
            });
            if (!res.ok) throw new Error("Delete error");
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    }

    static async login(email, password) {
        return await this.post("auth/login/", { email, password });
    }
    static async register(email, password, full_name = "", phone = "") {
        return await this.post("auth/register/", {
            email,
            password,
            full_name,
            phone,
        });
    }
    static async getProfile() {
        return await this.get("auth/profile/");
    }
    static async getHotels() {
        return await this.get("hotels/");
    }
    static async getBookings() {
        return await this.get("bookings/");
    }
    static async createRoom(hotelId, formData) {
        return await this.postForm(`hotels/${hotelId}/room/`, formData);
    }
    static async getRooms(hotelId) {
        return await this.get(`hotels/${hotelId}/room/`);
    }
    static async createBooking(roomId, check_in, check_out) {
        return await this.post(`rooms/${roomId}/booking/`, { check_in, check_out });
    }
}

export default API;
