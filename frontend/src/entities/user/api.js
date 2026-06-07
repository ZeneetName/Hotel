import Http from "../../shared/api/http.js";

export const userApi = {
    login(email, password) {
        return Http.post("auth/login/", { email, password });
    },
    register(email, password, full_name = "", phone = "") {
        return Http.post("auth/register/", { email, password, full_name, phone });
    },
    getProfile() {
        return Http.get("auth/profile/");
    },
};
