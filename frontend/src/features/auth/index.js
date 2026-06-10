import { showSection, hideAllSections, authSection } from "../../shared/ui/dom.js";
import { pushState } from "../../shared/lib/history.js";
import Toast from "../../shared/ui/toast.js";
import { userApi } from "../../entities/user/api.js";
import { setCurrentUser, clearSession } from "../../entities/user/session.js";
import { setHeaderAuth } from "../../widgets/header/index.js";
import { renderHotels } from "../../pages/hotels/index.js";

// Левая декоративная панель (общая для входа и регистрации).
function asidePanel(title, text, extraHtml = "") {
    return `
        <div class="auth-aside">
            <div class="auth-aside-top">
                <span class="auth-brand">
                    <span class="auth-brand-mark">🏨</span>
                    <span class="auth-brand-name">StayLux</span>
                </span>
            </div>
            <div class="auth-aside-mid">
                <h1 class="auth-aside-title">${title}</h1>
                <p class="auth-aside-text">${text}</p>
                ${extraHtml}
            </div>
            <p class="auth-aside-copy">© 2026 StayLux</p>
        </div>
    `;
}

// Переключатель показа пароля.
function wireEyes(root) {
    root.querySelectorAll(".auth-eye").forEach((eye) => {
        eye.onclick = () => {
            const input = eye.parentElement.querySelector("input");
            const show = input.type === "password";
            input.type = show ? "text" : "password";
            eye.textContent = show ? "🙈" : "👁";
        };
    });
}

export function renderAuthForm(skipHistory = false) {
    showSection(authSection);
    if (!skipHistory) pushState({ page: "login" }, "#login");

    authSection.innerHTML = `
        <div class="auth-page">
            ${asidePanel(
                "С возвращением,<br>путешественник",
                "Войдите, чтобы получить доступ к вашим бронированиям и персональным рекомендациям.",
                `<div class="auth-tags">
                    <span>500+ отелей</span>
                    <span>24/7 поддержка</span>
                    <span>Без комиссий</span>
                </div>`,
            )}
            <div class="auth-main">
                <div class="auth-card">
                    <button class="auth-back back-to-home">← Назад</button>
                    <div class="auth-head">
                        <h2>Вход в аккаунт</h2>
                        <p>Нет аккаунта? <a href="#" class="to-register">Зарегистрироваться</a></p>
                    </div>
                    <div class="auth-fields">
                        <div class="auth-field">
                            <label>Email</label>
                            <div class="auth-input">
                                <span class="auth-ic">✉</span>
                                <input type="email" class="auth-email" placeholder="your@email.ru">
                            </div>
                        </div>
                        <div class="auth-field">
                            <label>Пароль</label>
                            <div class="auth-input">
                                <span class="auth-ic">🔒</span>
                                <input type="password" class="auth-password" placeholder="••••••••">
                                <button type="button" class="auth-eye">👁</button>
                            </div>
                        </div>
                        <button class="btn auth-submit auth-login">Войти</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    wireEyes(authSection);
    authSection.querySelector(".back-to-home").onclick = () => renderHotels();
    authSection.querySelector(".to-register").onclick = (e) => {
        e.preventDefault();
        renderRegisterForm();
    };

    const submit = async () => {
        const email = authSection.querySelector(".auth-email").value.trim();
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
    authSection.querySelector(".auth-login").onclick = submit;
    authSection.querySelector(".auth-password").onkeydown = (e) => {
        if (e.key === "Enter") submit();
    };
}

export function renderRegisterForm(skipHistory = false) {
    showSection(authSection);
    if (!skipHistory) pushState({ page: "register" }, "#register");

    authSection.innerHTML = `
        <div class="auth-page">
            ${asidePanel(
                "Присоединяйтесь<br>к StayLux",
                "Создайте аккаунт, чтобы бронировать лучшие отели без наценок и управлять всем в одном месте.",
                `<div class="auth-benefits">
                    <div class="auth-benefit"><span>✓</span> Бронируйте лучшие отели без наценок</div>
                    <div class="auth-benefit"><span>✓</span> Управляйте всеми бронированиями</div>
                    <div class="auth-benefit"><span>✓</span> Добавляйте собственное жильё</div>
                </div>`,
            )}
            <div class="auth-main">
                <div class="auth-card">
                    <button class="auth-back back-to-home">← Назад</button>
                    <div class="auth-head">
                        <h2>Регистрация</h2>
                        <p>Уже есть аккаунт? <a href="#" class="to-login">Войти</a></p>
                    </div>
                    <div class="auth-fields">
                        <div class="auth-row">
                            <div class="auth-field">
                                <label>Имя</label>
                                <div class="auth-input">
                                    <span class="auth-ic">👤</span>
                                    <input type="text" class="reg-firstname" placeholder="Иван">
                                </div>
                            </div>
                            <div class="auth-field">
                                <label>Фамилия</label>
                                <div class="auth-input">
                                    <input type="text" class="reg-lastname" placeholder="Петров">
                                </div>
                            </div>
                        </div>
                        <div class="auth-field">
                            <label>Email</label>
                            <div class="auth-input">
                                <span class="auth-ic">✉</span>
                                <input type="email" class="reg-email" placeholder="your@email.ru">
                            </div>
                        </div>
                        <div class="auth-field">
                            <label>Телефон</label>
                            <div class="auth-input">
                                <span class="auth-ic">📞</span>
                                <input type="tel" class="reg-phone" placeholder="+79000000000">
                            </div>
                        </div>
                        <div class="auth-field">
                            <label>Роль</label>
                            <div class="auth-roles">
                                <button type="button" class="auth-role active" data-role="Default_user">
                                    <span class="auth-role-title">Гость</span>
                                    <span class="auth-role-desc">Ищу жильё</span>
                                </button>
                                <button type="button" class="auth-role" data-role="Owner">
                                    <span class="auth-role-title">Владелец</span>
                                    <span class="auth-role-desc">Сдаю жильё</span>
                                </button>
                            </div>
                        </div>
                        <div class="auth-field">
                            <label>Пароль</label>
                            <div class="auth-input">
                                <span class="auth-ic">🔒</span>
                                <input type="password" class="reg-password" placeholder="••••••••">
                                <button type="button" class="auth-eye">👁</button>
                            </div>
                            <div class="auth-strength" style="display:none">
                                <div class="auth-strength-bars">
                                    <span></span><span></span><span></span>
                                </div>
                                <span class="auth-strength-label"></span>
                            </div>
                        </div>
                        <div class="auth-field">
                            <label>Подтвердите пароль</label>
                            <div class="auth-input">
                                <span class="auth-ic">🔒</span>
                                <input type="password" class="reg-confirm" placeholder="••••••••">
                            </div>
                        </div>
                        <button class="btn auth-submit auth-register">Создать аккаунт</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    wireEyes(authSection);
    authSection.querySelector(".back-to-home").onclick = () => renderHotels();
    authSection.querySelector(".to-login").onclick = (e) => {
        e.preventDefault();
        renderAuthForm();
    };

    // Выбор роли
    let role = "Default_user";
    authSection.querySelectorAll(".auth-role").forEach((btn) => {
        btn.onclick = () => {
            authSection.querySelectorAll(".auth-role").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            role = btn.getAttribute("data-role");
        };
    });

    // Индикатор надёжности пароля
    const passInput = authSection.querySelector(".reg-password");
    const strengthBox = authSection.querySelector(".auth-strength");
    const bars = authSection.querySelectorAll(".auth-strength-bars span");
    const strengthLabel = authSection.querySelector(".auth-strength-label");
    const colors = ["", "#ef4444", "#f59e0b", "#22c55e"];
    const labels = ["", "Слабый", "Средний", "Сильный"];
    passInput.oninput = () => {
        const len = passInput.value.length;
        const s = len >= 8 ? 3 : len >= 6 ? 2 : len >= 1 ? 1 : 0;
        strengthBox.style.display = len ? "flex" : "none";
        bars.forEach((bar, i) => {
            bar.style.background = i < s ? colors[s] : "var(--muted)";
        });
        strengthLabel.textContent = labels[s];
        strengthLabel.style.color = colors[s];
    };

    authSection.querySelector(".auth-register").onclick = async () => {
        const firstName = authSection.querySelector(".reg-firstname").value.trim();
        const lastName = authSection.querySelector(".reg-lastname").value.trim();
        const email = authSection.querySelector(".reg-email").value.trim();
        const phone = authSection.querySelector(".reg-phone").value.trim();
        const password = authSection.querySelector(".reg-password").value;
        const confirm = authSection.querySelector(".reg-confirm").value;
        const full_name = [firstName, lastName].filter(Boolean).join(" ");

        if (!firstName || !email || !phone || !password) {
            Toast.warning("Заполните имя, email, телефон и пароль");
            return;
        }
        if (password.length < 5) {
            Toast.warning("Пароль должен быть не короче 5 символов");
            return;
        }
        if (password !== confirm) {
            Toast.warning("Пароли не совпадают");
            return;
        }

        try {
            const data = await userApi.register(email, password, full_name, phone, role);
            setCurrentUser(data.user, data.token);
            setHeaderAuth(true);
            hideAllSections();
            renderHotels();
            Toast.success("Вы успешно зарегистрировались!");
        } catch (err) {
            const message = err?.error || err?.detail || "Ошибка регистрации";
            Toast.error(message);
        }
    };
}

export function logout() {
    clearSession();
    setHeaderAuth(false);
    renderHotels();
}
