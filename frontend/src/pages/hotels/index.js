import { hideAllSections, hotelsList } from "../../shared/ui/dom.js";
import { pushState } from "../../shared/lib/history.js";
import { loaderHtml } from "../../shared/ui/loader.js";
import { hotelApi } from "../../entities/hotel/api.js";
import { renderHotelDetail } from "../hotel-detail/index.js";
import { ROOM_AMENITIES } from "../../entities/room/amenities.js";
import { escapeHtml } from "../../shared/lib/escape-html.js";

const BATCH_SIZE = 51;
let scrollObserver = null;

let currentHotels = [];
let activeFilters = { amenities: [], maxPrice: null };

function createHotelCard(hotel) {
    const img = hotel.hostel_images
        ? hotel.hostel_images.replace("http://localhost", "")
        : "https://source.unsplash.com/400x250/?hotel,resort";
    const rating = Number(hotel.rating) || 0;
    const ratingText = rating > 0 ? rating.toFixed(1).replace(/\.0$/, "") : null;

    const card = document.createElement("div");
    card.className = "hotel-card";
    card.style.cursor = "pointer";
    card.innerHTML = `
        <div class="hotel-card-media">
            <div class="hotel-img" style="background-image:url('${img}')"></div>
            ${ratingText ? `<span class="hotel-card-badge">★ ${ratingText}</span>` : ""}
        </div>
        <div class="hotel-info">
            <div class="hotel-card-top">
                <h2>${escapeHtml(hotel.title)}</h2>
            </div>
            <p class="hotel-card-city">г. ${escapeHtml(hotel.city) || "Город не указан"}</p>
            <div class="hotel-card-foot">
                <div class="hotel-card-price">
                    ${hotel.min_price ? `<b>от ${hotel.min_price} ₽</b><span> / ночь</span>` : `<span class="text-muted">Цена по запросу</span>`}
                </div>
                <span class="hotel-card-cta">Подробнее →</span>
            </div>
        </div>
    `;
    card.onclick = () => renderHotelDetail(hotel);
    return card;
}

function updateCount(n) {
    const countEl = document.querySelector(".hotels-count");
    if (!countEl) return;
    const word = n === 1 ? "объект" : n >= 2 && n <= 4 ? "объекта" : "объектов";
    countEl.textContent = `Найдено ${n} ${word}`;
}

function renderList(hotels) {
    if (scrollObserver) {
        scrollObserver.disconnect();
        scrollObserver = null;
    }
    hotelsList.innerHTML = "";

    if (hotels.length === 0) {
        hotelsList.innerHTML = `
            <div class="hotels-empty">
                <h3>Ничего не найдено</h3>
                <p>Попробуйте изменить фильтры, город или даты поездки.</p>
            </div>`;
        return;
    }

    const sentinel = document.createElement("div");
    sentinel.className = "hotels-sentinel";

    let rendered = 0;
    const renderNextBatch = () => {
        const next = hotels.slice(rendered, rendered + BATCH_SIZE);
        next.forEach((hotel) => hotelsList.insertBefore(createHotelCard(hotel), sentinel));
        rendered += next.length;
        if (rendered >= hotels.length) {
            scrollObserver?.disconnect();
            sentinel.remove();
        }
    };

    hotelsList.append(sentinel);
    renderNextBatch();

    if (rendered < hotels.length) {
        scrollObserver = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) renderNextBatch();
            },
            { rootMargin: "300px" },
        );
        scrollObserver.observe(sentinel);
    }
}

function applyAndRender() {
    let list = currentHotels.slice();

    if (activeFilters.amenities.length) {
        list = list.filter((h) =>
            activeFilters.amenities.every((key) =>
                Array.isArray(h.amenities) && h.amenities.includes(key),
            ),
        );
    }
    if (activeFilters.maxPrice != null) {
        list = list.filter((h) => {
            const price = Number(h.min_price) || 0;
            // 0 — «цена по запросу», такие отели не отсекаем порогом цены.
            return price === 0 || price <= activeFilters.maxPrice;
        });
    }

    updateCount(list.length);
    renderList(list);
}

function readFiltersFromSidebar() {
    const aside = document.querySelector(".hotels-filters");
    if (!aside) return;
    activeFilters.amenities = Array.from(
        aside.querySelectorAll(".filter-amenity-cb:checked"),
    ).map((cb) => cb.value);
    const range = aside.querySelector(".filter-price-range");
    activeFilters.maxPrice = range ? Number(range.value) : null;
}

function buildFiltersSidebar(hotels) {
    const aside = document.querySelector(".hotels-filters");
    if (!aside) return;

    const amenityRows = ROOM_AMENITIES.map(
        (a) => `
        <label class="filter-amenity">
            <input type="checkbox" class="filter-amenity-cb" value="${a.key}" ${activeFilters.amenities.includes(a.key) ? "checked" : ""}>
            <span class="filter-amenity-ic">${a.icon}</span>
            <span>${a.label}</span>
        </label>`,
    ).join("");

    // Потолок ползунка — реальная максимальная цена номера среди всех отелей.
    const prices = hotels.map((h) => Number(h.max_price) || 0).filter((p) => p > 0);
    const maxBound = prices.length ? Math.max(...prices) : 0;
    const currentMax = activeFilters.maxPrice != null ? activeFilters.maxPrice : maxBound;

    aside.innerHTML = `
        <div class="filters-head">
            <h3>Фильтры</h3>
            <button type="button" class="filters-reset">Сбросить</button>
        </div>
        <div class="filter-group">
            <p class="filter-group-title">Что включено</p>
            ${amenityRows}
        </div>
        ${
            maxBound > 0
                ? `<div class="filter-group">
            <p class="filter-group-title">Цена за ночь</p>
            <span class="filter-price-val">до ${currentMax} ₽</span>
            <input type="range" class="filter-price-range" min="0" max="${maxBound}" step="100" value="${currentMax}">
        </div>`
                : ""
        }
    `;

    aside
        .querySelectorAll(".filter-amenity-cb")
        .forEach((cb) => cb.addEventListener("change", () => {
            readFiltersFromSidebar();
            applyAndRender();
        }));

    const range = aside.querySelector(".filter-price-range");
    const valEl = aside.querySelector(".filter-price-val");
    if (range) {
        range.addEventListener("input", () => {
            valEl.textContent = `до ${range.value} ₽`;
        });
        range.addEventListener("change", () => {
            readFiltersFromSidebar();
            applyAndRender();
        });
    }

    aside.querySelector(".filters-reset")?.addEventListener("click", () => {
        activeFilters = { amenities: [], maxPrice: null };
        buildFiltersSidebar(hotels);
        applyAndRender();
    });
}

export async function renderHotels(skipHistory = false, filters = {}) {
    hideAllSections();
    if (!skipHistory) {
        pushState({ page: "hotels" }, "#hotels");
    }

    const hasFilters = !!(filters.search || filters.city || filters.check_in || filters.check_out);
    document
        .querySelector(".hotels-section")
        ?.classList.toggle("search-active", hasFilters);

    if (scrollObserver) {
        scrollObserver.disconnect();
        scrollObserver = null;
    }
    activeFilters = { amenities: [], maxPrice: null };
    hotelsList.innerHTML = "";
    let isLoaded = false;

    setTimeout(() => {
        if (!isLoaded) {
            hotelsList.innerHTML = `Загрузка... ${loaderHtml}`;
        }
    }, 500);
    try {
        const hotels = await hotelApi.list(filters);
        isLoaded = true;
        currentHotels = hotels;
        buildFiltersSidebar(hotels);
        applyAndRender();
    } catch {
        hotelsList.innerHTML = "Ошибка загрузки гостиниц";
    }
}
