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
        // Сжимаем изображения перед отправкой
        const compressedFormData = await this.compressFormDataImages(formData);
        const res = await fetch(BASE_URL + url, {
            method: "POST",
            headers: { ...this.getAuthHeaders() },
            body: compressedFormData,
        });
        const json = await res.json();
        if (!res.ok) {
            console.error("PostForm error", json);
            throw json;
        }
        return json;
    }

    static async compressFormDataImages(formData) {
        const newFormData = new FormData();
        for (const [key, value] of formData.entries()) {
            if (value instanceof File && value.type.startsWith('image/')) {
                const compressed = await this.compressImage(value, 800, 0.7);
                newFormData.append(key, compressed, value.name);
            } else {
                newFormData.append(key, value);
            }
        }
        return newFormData;
    }

    static compressImage(file, maxWidth, quality) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
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

    static async updateRoom(roomId, formData) {
        return await this.patch(`rooms/`, roomId, formData);
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
        return await this.post(`rooms/${roomId}/booking/`, {
            check_in,
            check_out,
        });
    }

    // Reviews API
    static async getReviews(hotelId) {
        return await this.get(`hotels/${hotelId}/reviews/`);
    }

    static async createReview(hotelId, comment_text, score) {
        return await this.post(`hotels/${hotelId}/reviews/`, {
            comment_text,
            score,
        });
    }

    static async updateReview(hotelId, reviewId, comment_text, score) {
        try {
            const res = await fetch(BASE_URL + `hotels/${hotelId}/reviews/?review_id=${reviewId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...this.getAuthHeaders(),
                },
                body: JSON.stringify({ comment_text, score }),
            });
            if (!res.ok) throw new Error("Patch error");
            return await res.json();
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

    static async deleteReview(hotelId, reviewId) {
        try {
            const res = await fetch(BASE_URL + `hotels/${hotelId}/reviews/?review_id=${reviewId}`, {
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

    // Dishes
    static async getDishes(hotelId) {
        return await this.get(`dishes/?hotel=${hotelId}`);
    }

    static async createDish(hotelId, formData) {
        return await this.postForm(`hotels/${hotelId}/dish/`, formData);
    }

    static async updateDish(dishId, data) {
        try {
            const res = await fetch(BASE_URL + `dishes/${dishId}/`, {
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

    static async deleteDish(dishId) {
        try {
            const res = await fetch(BASE_URL + `dishes/${dishId}/`, {
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

    // Services
    static async getServices(hotelId) {
        return await this.get(`services/?hotel=${hotelId}`);
    }

    static async createService(hotelId, formData) {
        return await this.postForm(`hotels/${hotelId}/service/`, formData);
    }

    static async updateService(serviceId, data) {
        try {
            const res = await fetch(BASE_URL + `services/${serviceId}/`, {
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

    static async deleteService(serviceId) {
        try {
            const res = await fetch(BASE_URL + `services/${serviceId}/`, {
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
}

export default API;
