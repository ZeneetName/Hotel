/**
 * Toast Notification System
 * Позволяет показывать уведомления в правом нижнем углу
 * Типы: success (зеленый), error (красный), info (синий), warning (желтый)
 */

class NotificationManager {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.nextId = 0;
        this.init();
    }

    init() {
        // Создаем контейнер для уведомлений если его нет
        if (!document.querySelector(".notifications-container")) {
            this.container = document.createElement("div");
            this.container.className = "notifications-container";
            document.body.appendChild(this.container);
        } else {
            this.container = document.querySelector(".notifications-container");
        }
    }

    /**
     * Показывает уведомление
     * @param {string} message - Текст сообщения
     * @param {string} type - Тип: 'success', 'error', 'info', 'warning'
     * @param {number} duration - Длительность показа в мс (0 = не скрывать)
     */
    show(message, type = "info", duration = 4000) {
        const id = this.nextId++;

        // Создаем элемент уведомления
        const notification = document.createElement("div");
        notification.className = `notification notification-${type}`;
        notification.id = `notification-${id}`;

        // Иконки для разных типов
        const icons = {
            success: "✓",
            error: "✕",
            info: "ℹ",
            warning: "⚠",
        };

        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${icons[type] || "•"}</span>
                <span class="notification-message">${this.escapeHtml(message)}</span>
            </div>
            <button class="notification-close" aria-label="Закрыть">×</button>
        `;

        // Добавляем обработчик для кнопки закрытия
        notification.querySelector(".notification-close").onclick = () => {
            this.hide(id);
        };

        // Добавляем в контейнер
        this.container.appendChild(notification);
        this.notifications.set(id, { element: notification, timeout: null });

        // Запускаем анимацию появления
        setTimeout(() => notification.classList.add("notification-show"), 10);

        // Автоматическое скрытие если duration > 0
        if (duration > 0) {
            const timeout = setTimeout(() => this.hide(id), duration);
            const notifData = this.notifications.get(id);
            if (notifData) {
                notifData.timeout = timeout;
            }
        }

        return id;
    }

    /**
     * Скрывает уведомление
     * @param {number} id - ID уведомления
     */
    hide(id) {
        const notifData = this.notifications.get(id);
        if (!notifData) return;

        const { element, timeout } = notifData;

        // Очищаем timeout если есть
        if (timeout) clearTimeout(timeout);

        // Запускаем анимацию скрытия
        element.classList.remove("notification-show");

        // Удаляем элемент после анимации
        setTimeout(() => {
            element.remove();
            this.notifications.delete(id);
        }, 300);
    }

    /**
     * Показывает успешное уведомление (зеленое)
     * @param {string} message - Текст сообщения
     * @param {number} duration - Длительность показа
     */
    success(message, duration = 3000) {
        return this.show(message, "success", duration);
    }

    /**
     * Показывает ошибку (красное)
     * @param {string} message - Текст сообщения
     * @param {number} duration - Длительность показа
     */
    error(message, duration = 4000) {
        return this.show(message, "error", duration);
    }

    /**
     * Показывает информационное уведомление (синее)
     * @param {string} message - Текст сообщения
     * @param {number} duration - Длительность показа
     */
    info(message, duration = 3000) {
        return this.show(message, "info", duration);
    }

    /**
     * Показывает предупреждение (желтое)
     * @param {string} message - Текст сообщения
     * @param {number} duration - Длительность показа
     */
    warning(message, duration = 4000) {
        return this.show(message, "warning", duration);
    }

    /**
     * Экранирует HTML для безопасности
     */
    escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }
}

// Создаем глобальный экземпляр
const Toast = new NotificationManager();

export default Toast;
