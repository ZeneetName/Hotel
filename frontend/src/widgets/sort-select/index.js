// Декорированный дропдаун сортировки. Нативный <select> нельзя стилизовать
// (его раскрытый список рисует ОС), поэтому строим свой список из элементов,
// а исходный <select> прячем и держим в синхроне: при выборе пункта
// проставляем ему value и шлём событие change — вся существующая логика
// сортировки продолжает работать без изменений.

const CHEV =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
const CHECK =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

const IC = {
    sort: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>',
    date: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 2v4"/><path d="M16 2v4"/></svg>',
    star: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>',
};

function iconFor(value) {
    if (value.includes("rating")) return IC.star;
    if (value.includes("created_at")) return IC.date;
    return IC.sort;
}

export function enhanceSortSelect(select) {
    if (!select || select.dataset.enhanced) return;
    select.dataset.enhanced = "1";

    const options = [...select.options].map((o) => ({
        value: o.value,
        label: o.textContent.trim(),
    }));

    const dd = document.createElement("div");
    dd.className = "sort-dd";
    dd.innerHTML = `
        <button type="button" class="sort-dd-trigger" aria-haspopup="listbox" aria-expanded="false">
            <span class="sort-dd-current"></span>
            <span class="sort-dd-chev">${CHEV}</span>
        </button>
        <ul class="sort-dd-menu" role="listbox">
            ${options
                .map(
                    (o) => `<li class="sort-dd-option" role="option" data-value="${o.value}">
                <span class="sort-dd-ic">${iconFor(o.value)}</span>
                <span class="sort-dd-text">${o.label}</span>
                <span class="sort-dd-check">${CHECK}</span>
            </li>`,
                )
                .join("")}
        </ul>`;

    select.style.display = "none";
    select.after(dd);

    const trigger = dd.querySelector(".sort-dd-trigger");
    const current = dd.querySelector(".sort-dd-current");
    const items = [...dd.querySelectorAll(".sort-dd-option")];

    const sync = () => {
        const sel = options.find((o) => o.value === select.value) || options[0];
        current.textContent = sel.label;
        items.forEach((li) =>
            li.classList.toggle("selected", li.dataset.value === select.value),
        );
    };
    sync();

    const close = () => {
        dd.classList.remove("open");
        trigger.setAttribute("aria-expanded", "false");
    };

    trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        const open = dd.classList.toggle("open");
        trigger.setAttribute("aria-expanded", String(open));
    });

    items.forEach((li) =>
        li.addEventListener("click", () => {
            if (select.value !== li.dataset.value) {
                select.value = li.dataset.value;
                select.dispatchEvent(new Event("change", { bubbles: true }));
            }
            sync();
            close();
        }),
    );

    // Закрытие по клику вне и по Escape
    document.addEventListener("click", (e) => {
        if (!dd.contains(e.target)) close();
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") close();
    });

    // Если значение поменяли программно — обновляем подпись/отметку
    select.addEventListener("change", sync);
}
