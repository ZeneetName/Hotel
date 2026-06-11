import { SVG_TV } from "../../shared/ui/svg/TV.js";
import { SVG_eat } from "../../shared/ui/svg/eat.js";
import { SVG_balcony } from "../../shared/ui/svg/balcony.js";
import { SVG_parking } from "../../shared/ui/svg/parking.js";
import { SVG_air_conditioner } from "../../shared/ui/svg/air_conditioner.js";
import { SVG_wi_fi } from "../../shared/ui/svg/wi-fi.js";

export const ROOM_AMENITIES = [
    { key: "wifi", label: "Wi-Fi", icon: SVG_wi_fi },
    { key: "ac", label: "Кондиционер", icon: SVG_air_conditioner },
    { key: "breakfast", label: "Завтрак", icon: SVG_eat },
    { key: "balcony", label: "Балкон", icon: SVG_balcony },
    { key: "tv", label: "Телевизор", icon: SVG_TV },
    { key: "parking", label: "Парковка", icon: SVG_parking },
];

export function amenityChipsHtml(amenities) {
    if (!Array.isArray(amenities) || !amenities.length) return "";
    const chips = amenities
        .map((key) => {
            const a = ROOM_AMENITIES.find((x) => x.key === key);
            return a ? `<span class="room-amenity-chip">${a.icon} ${a.label}</span>` : "";
        })
        .filter(Boolean)
        .join("");
    return chips ? `<div class="room-amenities">${chips}</div>` : "";
}

export function amenitiesCheckboxesHtml(selected = []) {
    return `<div class="amenities-picker">${ROOM_AMENITIES.map(
        (a) => `
        <label class="amenity-option">
            <input type="checkbox" class="amenity-checkbox" value="${a.key}" ${selected.includes(a.key) ? "checked" : ""}>
            <span>${a.icon} ${a.label}</span>
        </label>`,
    ).join("")}</div>`;
}

export function getSelectedAmenities(container) {
    return Array.from(container.querySelectorAll(".amenity-checkbox:checked")).map(
        (cb) => cb.value,
    );
}
