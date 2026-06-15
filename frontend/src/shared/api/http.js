import { getCookie } from "../lib/cookie.js";

const BASE_URL = "/api/";

/**
 * Базовый HTTP-клиент.
 * Содержит только транспортный уровень (методы запросов и сжатие изображений).
 * Доменные методы вынесены в entities/<entity>/api.js.
 */
class Http {
    static getAuthHeaders() {
        const token = getCookie("token") || localStorage.getItem("token");
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
}

export { BASE_URL };
export default Http;
