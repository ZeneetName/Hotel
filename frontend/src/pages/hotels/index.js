import { hideAllSections, hotelsList } from "../../shared/ui/dom.js";
import { pushState } from "../../shared/lib/history.js";
import { loaderHtml } from "../../shared/ui/loader.js";
import { hotelApi } from "../../entities/hotel/api.js";
import { renderHotelDetail } from "../hotel-detail/index.js";

const BATCH_SIZE = 51;
let scrollObserver = null;

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
                <h2>${hotel.title}</h2>
                ${ratingText ? `<span class="hotel-card-rating">★ ${ratingText}</span>` : ""}
            </div>
            <p class="hotel-card-city">📍 ${hotel.city || "Город не указан"}</p>
            ${hotel.address ? `<p class="hotel-card-addr">${hotel.address}</p>` : ""}
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

export async function renderHotels(skipHistory = false) {
    hideAllSections();
    if (!skipHistory) {
        pushState({ page: "hotels" }, "#hotels");
    }
    // Сбрасываем наблюдатель от предыдущего рендера
    if (scrollObserver) {
        scrollObserver.disconnect();
        scrollObserver = null;
    }
    hotelsList.innerHTML = "";
    let isLoaded = false;

    setTimeout(() => {
        if (!isLoaded) {
            hotelsList.innerHTML = `Загрузка... ${loaderHtml}`;
        }
    }, 500);
    try {
        const hotels = await hotelApi.list();
        isLoaded = true;
        hotelsList.innerHTML = "";

        const countEl = document.querySelector(".hotels-count");
        if (countEl) {
            const n = hotels.length;
            const word = n === 1 ? "объект" : n >= 2 && n <= 4 ? "объекта" : "объектов";
            countEl.textContent = `Найдено ${n} ${word}`;
        }

        // Точка-«страж» для подгрузки следующей партии
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
    } catch {
        hotelsList.innerHTML = "Ошибка загрузки гостиниц";
    }
}
