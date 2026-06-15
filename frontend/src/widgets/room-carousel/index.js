// Карусель фотографий номера: внедрение стилей + логика переключения слайдов.

(function injectCarouselStyles() {
    if (document.getElementById("room-carousel-styles")) return;
    const style = document.createElement("style");
    style.id = "room-carousel-styles";
    style.textContent = `
        .room-carousel {
            position: relative;
            width: 100%;
            height: 300px;
            border-radius: 12px;
            overflow: hidden;
            margin-bottom: 16px;
            background: #1a1a1a;
        }
        .room-carousel-track {
            display: flex;
            height: 100%;
            transition: transform 0.35s ease;
        }
        .room-carousel-slide {
            flex: 0 0 100%;
            height: 100%;
            background-size: cover;
            background-position: center;
        }
        .room-carousel-btn {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 30px;
            height: 30px;
            aspect-ratio: 1 / 1;
            padding: 0;
            box-sizing: border-box;
            border: none;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.45);
            color: #fff;
            font-size: 16px;
            line-height: 1;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s, transform 0.15s;
            z-index: 2;
        }
        .room-carousel-btn:hover { background: rgba(0, 0, 0, 0.7); }
        .room-carousel-prev { left: 10px; }
        .room-carousel-next { right: 10px; }
        .room-carousel-counter {
            position: absolute;
            top: 12px;
            right: 12px;
            padding: 4px 10px;
            border-radius: 12px;
            background: rgba(0, 0, 0, 0.6);
            color: #fff;
            font-size: 13px;
            z-index: 2;
        }
        .room-carousel-dots {
            position: absolute;
            bottom: 12px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 8px;
            z-index: 2;
        }
        .room-carousel-dot {
            width: 9px;
            height: 9px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            cursor: pointer;
            transition: background 0.2s;
        }
        .room-carousel-dot.active { background: #fff; }
    `;
    document.head.appendChild(style);
})();

export function setupRoomCarousel(carousel, count) {
    if (!carousel || count <= 1) return;
    const track = carousel.querySelector(".room-carousel-track");
    const current = carousel.querySelector(".room-carousel-current");
    const dots = [...carousel.querySelectorAll(".room-carousel-dot")];

    const go = (index) => {
        const next = (index + count) % count;
        carousel.dataset.index = next;
        track.style.transform = `translateX(-${next * 100}%)`;
        if (current) current.textContent = next + 1;
        dots.forEach((d, i) => d.classList.toggle("active", i === next));
    };

    carousel.querySelector(".room-carousel-prev").onclick = () =>
        go(Number(carousel.dataset.index) - 1);
    carousel.querySelector(".room-carousel-next").onclick = () =>
        go(Number(carousel.dataset.index) + 1);
    dots.forEach((dot) => {
        dot.onclick = () => go(Number(dot.dataset.dot));
    });

    // Свайп на тач-устройствах
    let startX = null;
    track.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX;
    });
    track.addEventListener("touchend", (e) => {
        if (startX === null) return;
        const diff = e.changedTouches[0].clientX - startX;
        if (Math.abs(diff) > 40) {
            go(Number(carousel.dataset.index) + (diff < 0 ? 1 : -1));
        }
        startX = null;
    });
}
