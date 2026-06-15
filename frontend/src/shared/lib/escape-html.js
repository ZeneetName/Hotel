// Экранирование пользовательского текста перед вставкой в innerHTML.
// Защита от XSS: спецсимволы HTML и кавычки заменяются на сущности, поэтому
// введённый пользователем <script> или разметка отображаются как обычный
// текст и не исполняются — в т.ч. внутри атрибутов value="...".

const ESCAPE_MAP = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
};

export function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value).replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch]);
}
