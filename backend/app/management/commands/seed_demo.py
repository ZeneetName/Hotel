"""Наполнение БД демо-данными.

Для каждой гостиницы гарантирует:
  - главное фото + галерею (HotelImage),
  - 3 номера разных категорий (стандарт / комфорт / люкс) с фото и удобствами,
  - меню (Dish) и услуги (Service) с фото.

Фото скачиваются один раз небольшими «пулами» по категориям и переиспользуются
между объектами — это быстро и не зависит от лимитов фотостоков. Если интернета
нет, записи всё равно создаются, просто без картинок.

Команда идемпотентна: повторный запуск не дублирует уже заполненное.
Запуск:  python manage.py seed_demo
"""
import random
import urllib.request
import uuid

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db.models import Avg

from app.models import (
    Hotel,
    HotelImage,
    Room,
    RoomImage,
    Dish,
    Service,
    Review,
    CustomAuthenticationUser,
)

# --- наборы изображений по категориям (themed + надёжный picsum-fallback) ---
IMAGE_SETS = {
    "hotel": [f"https://loremflickr.com/1024/640/hotel,resort,facade?lock={i}" for i in range(1, 7)],
    "room": [f"https://loremflickr.com/1024/640/hotel,room,bedroom?lock={i}" for i in range(10, 16)],
    "food": [f"https://loremflickr.com/800/600/food,dish,meal?lock={i}" for i in range(20, 26)],
    "service": [f"https://loremflickr.com/800/600/spa,wellness,hotel?lock={i}" for i in range(30, 36)],
}

ROOMS = [
    {
        "title": "Стандартный номер",
        "type": "standard",
        "max_place": 2,
        "square": 20,
        "price_on_one_day": 3200,
        "amenities": ["wifi", "tv"],
        "description": "Уютный номер с всем необходимым для комфортного отдыха: удобная кровать, рабочая зона и быстрый Wi-Fi.",
    },
    {
        "title": "Номер «Комфорт»",
        "type": "standard",
        "max_place": 3,
        "square": 28,
        "price_on_one_day": 5600,
        "amenities": ["wifi", "tv", "ac", "breakfast"],
        "description": "Просторный номер с кондиционером и включённым завтраком — идеально для пары или небольшой семьи.",
    },
    {
        "title": "Люкс с видом",
        "type": "deluxe",
        "max_place": 4,
        "square": 46,
        "price_on_one_day": 12400,
        "amenities": ["wifi", "tv", "ac", "breakfast", "balcony", "parking"],
        "description": "Премиальный люкс с балконом, панорамным видом, мини-баром и собственной парковкой.",
    },
]

DISHES = [
    {"title": "Континентальный завтрак", "composition": "Круассан, джем, масло, кофе, апельсиновый сок", "weight": 350, "price": 690},
    {"title": "Паста Карбонара", "composition": "Спагетти, бекон, яичный соус, пармезан", "weight": 320, "price": 850},
    {"title": "Цезарь с курицей", "composition": "Салат романо, курица гриль, сухарики, соус Цезарь", "weight": 290, "price": 780},
    {"title": "Стейк Рибай", "composition": "Говядина рибай, картофель, овощи гриль", "weight": 420, "price": 1990},
    {"title": "Тирамису", "composition": "Маскарпоне, савоярди, кофе, какао", "weight": 180, "price": 520},
]

SERVICES = [
    {"title": "Спа-комплекс", "price": 2500, "duration": 90},
    {"title": "Трансфер из аэропорта", "price": 1800, "duration": 60},
    {"title": "Завтрак в номер", "price": 700, "duration": 30},
    {"title": "Прокат велосипедов", "price": 600, "duration": 120},
    {"title": "Экскурсия по городу", "price": 1500, "duration": 180},
]

# Гости, которые будут авторами отзывов (создаются при первом запуске).
GUEST_REVIEWERS = [
    "Анна Смирнова", "Дмитрий Орлов", "Елена Кузнецова", "Игорь Соколов",
    "Мария Попова", "Алексей Волков", "Ольга Морозова", "Сергей Лебедев",
]

# Пул отзывов (оценка, текст) — оценки разные, чтобы средний рейтинг был
# реалистичным, а не везде 5.0.
REVIEW_POOL = [
    (5, "Прекрасный отель, всё на высшем уровне. Обязательно вернёмся!"),
    (5, "Чисто, уютно, персонал очень внимательный. Рекомендую."),
    (4, "Хорошее расположение и комфортные номера. Завтрак понравился."),
    (4, "Уютные номера и приятный персонал. Немного шумно вечером."),
    (3, "Нормально за свои деньги, но уборка могла быть лучше."),
    (5, "Лучший отдых за последнее время. Виды из окна шикарные."),
    (4, "Удобно, чисто, вкусно. Приедем ещё."),
    (3, "Среднее впечатление: номер хороший, а сервис на завтраке медленный."),
    (5, "Всё понравилось: и номер, и спа, и расположение."),
    (4, "Отличное соотношение цены и качества. Спасибо за отдых."),
]


class Command(BaseCommand):
    help = "Наполняет БД демо-данными: номера, меню, услуги и фотографии для каждой гостиницы"

    def _download_pool(self, urls):
        """Скачивает картинки из списка; возвращает список bytes (пропуская сбои)."""
        pool = []
        for url in urls:
            data = self._fetch(url)
            if data:
                pool.append(data)
        return pool

    def _fetch(self, url):
        # picsum как запасной источник, если themed-урл не ответил
        seed = uuid.uuid4().hex[:8]
        for candidate in (url, f"https://picsum.photos/seed/{seed}/1024/640"):
            try:
                req = urllib.request.Request(candidate, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, timeout=25) as resp:
                    data = resp.read()
                    if data and len(data) > 2000:
                        return data
            except Exception:
                continue
        return None

    def _get_guest_reviewers(self):
        """Создаёт (один раз) пул гостей-авторов отзывов и возвращает их."""
        guests = []
        for i, name in enumerate(GUEST_REVIEWERS):
            email = f"guest{i}@example.com"
            user = CustomAuthenticationUser.objects.filter(email=email).first()
            if user is None:
                user = CustomAuthenticationUser.objects.create_user(
                    email=email,
                    password="guestpass123",
                    full_name=name,
                    phone=f"+7900{i:07d}",
                    roles="Default_user",
                )
            guests.append(user)
        return guests

    def handle(self, *args, **options):
        random.seed(42)
        self.stdout.write("Скачиваю пулы изображений…")
        pools = {key: self._download_pool(urls) for key, urls in IMAGE_SETS.items()}
        for key, pool in pools.items():
            self.stdout.write(f"  {key}: {len(pool)} фото")

        reviewers = self._get_guest_reviewers()

        def pick(category, idx):
            pool = pools.get(category) or []
            if not pool:
                return None
            return pool[idx % len(pool)]

        hotels = list(Hotel.objects.all())
        if not hotels:
            self.stdout.write(self.style.WARNING("В БД нет гостиниц — нечего наполнять."))
            return

        for h_index, hotel in enumerate(hotels):
            self.stdout.write(f"\n→ {hotel.title}")

            # --- главное фото ---
            if not hotel.hostel_images:
                data = pick("hotel", h_index)
                if data:
                    hotel.hostel_images.save(f"hotel_{h_index}.jpg", ContentFile(data), save=False)

            # --- галерея ---
            if hotel.images.count() < 3:
                for g in range(3):
                    data = pick("hotel", h_index + g + 1)
                    if data:
                        img = HotelImage(hotel=hotel)
                        img.image.save(f"hotel_{h_index}_g{g}.jpg", ContentFile(data), save=True)

            # --- номера ---
            if hotel.hotel_room.count() == 0:
                for r_index, spec in enumerate(ROOMS):
                    room = Room.objects.create(
                        hotel=hotel,
                        title=spec["title"],
                        type=spec["type"],
                        max_place=spec["max_place"],
                        square=spec["square"],
                        price_on_one_day=spec["price_on_one_day"],
                        amenities=spec["amenities"],
                        description=spec["description"],
                    )
                    data = pick("room", h_index + r_index)
                    if data:
                        room.room_images.save(f"room_{h_index}_{r_index}.jpg", ContentFile(data), save=True)
                        gal = pick("room", h_index + r_index + 3)
                        if gal:
                            ri = RoomImage(room=room)
                            ri.image.save(f"room_{h_index}_{r_index}_g.jpg", ContentFile(gal), save=True)

            # обновим min_price на модели (сериализатор считает динамически, но пусть совпадает)
            prices = [r.price_on_one_day for r in hotel.hotel_room.all()]
            if prices:
                hotel.min_price = min(prices)
            hotel.save()

            # --- меню (Dish) ---
            if not Dish.objects.filter(hotel=hotel).exists():
                for d_index, spec in enumerate(DISHES):
                    dish = Dish(
                        hotel=hotel,
                        title=spec["title"],
                        composition=spec["composition"],
                        weight=spec["weight"],
                        price=spec["price"],
                    )
                    data = pick("food", h_index + d_index)
                    if data:
                        dish.dish_images.save(f"dish_{h_index}_{d_index}.jpg", ContentFile(data), save=False)
                    dish.save()

            # --- услуги (Service) ---
            if not Service.objects.filter(hotel=hotel).exists():
                for s_index, spec in enumerate(SERVICES):
                    srv = Service(
                        hotel=hotel,
                        title=spec["title"],
                        price=spec["price"],
                        duration=spec["duration"],
                    )
                    data = pick("service", h_index + s_index)
                    if data:
                        srv.service_images.save(f"service_{h_index}_{s_index}.jpg", ContentFile(data), save=False)
                    srv.save()

            # --- отзывы (Review) ---
            # Доводим до 3–4 отзывов на отель. Авторами берём гостей и обычных
            # пользователей, исключая владельца отеля; один автор — один отзыв.
            existing = set(hotel.hotel_reviews.values_list("user_id", flat=True))
            target = random.randint(3, 4)
            need = target - len(existing)
            if need > 0:
                candidates = [u for u in reviewers if u.id != hotel.owner_id and u.id not in existing]
                random.shuffle(candidates)
                chosen_reviews = random.sample(REVIEW_POOL, min(need, len(candidates), len(REVIEW_POOL)))
                for user, (score, text) in zip(candidates, chosen_reviews):
                    Review.objects.create(hotel=hotel, user=user, score=score, comment_text=text)

        # Пересчитываем рейтинг каждого отеля строго по его отзывам, чтобы
        # бейдж совпадал со средним по отзывам (0, если отзывов нет).
        self.stdout.write("\nПересчитываю средний рейтинг по отзывам…")
        for hotel in Hotel.objects.all():
            avg = hotel.hotel_reviews.aggregate(a=Avg("score"))["a"] or 0
            hotel.rating = round(avg, 1)
            hotel.save(update_fields=["rating"])

        self.stdout.write(self.style.SUCCESS("\nГотово! Демо-данные добавлены."))
