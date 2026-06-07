export const ROOM_AMENITIES = [
    { key: "wifi", label: "Wi-Fi", icon: "📶" },
    { key: "ac", label: "Кондиционер", icon: "❄️" },
    { key: "breakfast", label: "Завтрак", icon: "🍳" },
    { key: "balcony", label: "Балкон", icon: "🌅" },
    { key: "tv", label: "Телевизор", icon: "📺" },
    { key: "parking", label: "Парковка", icon: "🅿️" },
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
