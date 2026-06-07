import { showSection, hideAllSections, authSection } from "../../shared/ui/dom.js";
import { pushState } from "../../shared/lib/history.js";
import Toast from "../../shared/ui/toast.js";
import { userApi } from "../../entities/user/api.js";
import { setCurrentUser, clearSession } from "../../entities/user/session.js";
import { setHeaderAuth } from "../../widgets/header/index.js";
import { renderHotels } from "../../pages/hotels/index.js";

export function renderAuthForm(skipHistory = false) {
    showSection(authSection);
    if (!skipHistory) pushState({ page: "login" }, "#login");
    authSection.innerHTML = `
        <div class="auth-form">
            <h2>Вход</h2>
            <input type="email" class="auth-email" placeholder="Email">
            <input type="password" class="auth-password" placeholder="Пароль">
            <button class="btn auth-login">Войти</button>
            <p>Нет аккаунта? <a href="#" class="to-register">Зарегистрироваться</a></p>
        </div>
    `;
    authSection.querySelector(".auth-login").onclick = async () => {
        const email = authSection.querySelector(".auth-email").value;
        const password = authSection.querySelector(".auth-password").value;

        if (!email || !password) {
            Toast.error("Заполните email и пароль");
            return;
        }

        try {
            const data = await userApi.login(email, password);
            setCurrentUser(data.user, data.token);
            setHeaderAuth(true);
            hideAllSections();
            renderHotels();
            Toast.success("Вы успешно вошли!");
        } catch (err) {
            const message = err?.error || err?.detail || "Проверьте email и пароль";
            Toast.error(message);
        }
    };
    authSection.querySelector(".to-register").onclick = (e) => {
        e.preventDefault();
        renderRegisterForm();
    };
}

export function renderRegisterForm(skipHistory = false) {
    showSection(authSection);
    if (!skipHistory) pushState({ page: "register" }, "#register");
    authSection.innerHTML = `
        <div class="auth-form">
            <h2>Регистрация</h2>
            <input type="email" class="reg-email" placeholder="Email">
            <input type="password" class="reg-password" placeholder="Пароль">
            <input type="text" class="reg-fullname" placeholder="Полное имя">
            <input type="text" class="reg-phone" placeholder="Телефон (+7...)">
            <button class="btn auth-register">Зарегистрироваться</button>
            <p>Есть аккаунт? <a href="#" class="to-login">Войти</a></p>
        </div>
    `;
    authSection.querySelector(".auth-register").onclick = async () => {
        const email = authSection.querySelector(".reg-email").value;
        const password = authSection.querySelector(".reg-password").value;
        const full_name = authSection.querySelector(".reg-fullname").value;
        const phone = authSection.querySelector(".reg-phone").value;
        try {
            const data = await userApi.register(email, password, full_name, phone);
            setCurrentUser(data.user, data.token);
            setHeaderAuth(true);
            hideAllSections();
            renderHotels();
            Toast.success("Вы успешно зарегистрировались!");
        } catch (err) {
            Toast.error("Ошибка регистрации");
        }
    };
    authSection.querySelector(".to-login").onclick = (e) => {
        e.preventDefault();
        renderAuthForm();
    };
}

export function logout() {
    clearSession();
    setHeaderAuth(false);
    renderHotels();
}
