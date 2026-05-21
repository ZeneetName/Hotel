Ниже представлено полное техническое задание (ТЗ) на основе твоего финального кода и требований, оформленное в формате Markdown (.md).
------------------------------
## Техническое Задание (ТЗ) на разработку API системы бронирования отелей## 1. Общее описание
Разработка серверной части (API) для платформы, позволяющей владельцам размещать отели и номера, а пользователям — бронировать их и оставлять отзывы.
## 2. Стек технологий

* Язык: Python 3.x
* Фреймворк: Django + Django REST Framework (DRF)
* Аутентификация: Bearer Token (на базе TokenAuthentication)
* Формат ID: UUID для всех сущностей

------------------------------
## 3. Модели данных## 3.1. Пользователь (CustomAuthenticationUser)
Модель расширяет AbstractUser.

* id: UUID (Primary Key, editable=False).
* email: EmailField (Unique, используется как логин).
* full_name: CharField (ФИО пользователя).
* phone: CharField (Unique, номер телефона).
* is_admin: BooleanField (Флаг администратора).
* password: Хэшированная строка.

## 3.2. Отель (Hotel)

* id: UUID (Primary Key).
* owner: ForeignKey (Связь с User, related_name='hotels').
* hostel_images: ImageField (Главное фото отеля).
* title: CharField (Unique, название).
* description: TextField (Описание отеля).
* address: TextField (Адрес).
* rating: FloatField (Средняя оценка отеля, авторасчет).

## 3.3. Номер (Room)

* id: UUID (Primary Key).
* hotel: ForeignKey (Связь с Hotel, related_name='rooms').
* room_images: ImageField (Фото номера).
* type: CharField (Choices: standard, deluxe).
* price_on_one_day: IntegerField (Цена за 1 сутки).
* description: TextField (Описание конкретного номера).

## 3.4. Бронирование (Booking)

* id: UUID (Primary Key).
* user: ForeignKey (Связь с User, related_name='user_bookings').
* room: ForeignKey (Связь с Room, related_name='room_bookings').
* check_in: DateField (Дата заезда).
* check_out: DateField (Дата выезда).
* total_price: IntegerField (Итоговая стоимость).

## 3.5. Отзыв (Review)

* id: UUID (Primary Key).
* hotel: ForeignKey (Связь с Hotel, related_name='hotel_reviews').
* user: ForeignKey (Связь с User, related_name='user_reviews').
* text: TextField (Текст комментария).
* score: SmallIntegerField (Оценка от 1 до 5).
* created_at: DateTimeField (Дата создания, auto_now_add=True).

------------------------------
## 4. Эндпоинты API (URLs)

| Метод | URL | Описание | Доступ |
|---|---|---|---|
| POST | /api/auth/register/ | Регистрация пользователя | Всем |
| POST | /api/auth/login/ | Получение Bearer Token | Всем |
| GET | /api/hotels/ | Список отелей (с фильтрами) | Всем |
| POST | /api/hotels/ | Создание отеля | Авторизован |
| GET | /api/hotels/{id}/ | Детали отеля и список его номеров | Всем |
| POST | /api/bookings/ | Создание бронирования | Авторизован |
| GET | /api/bookings/my/ | История броней текущего пользователя | Авторизован |
| POST | /api/reviews/ | Оставить отзыв | Авторизован |


# Обновленная спецификация API и Матрица Доступа

### 🔑 Авторизация и профиль (`AuthRegisterViewSets`)
* `POST /api/auth/register/` — регистрация нового аккаунта (Доступно всем).
* `POST /api/auth/login/` — аутентификация и получение токена (Доступно всем).
* `GET /api/auth/me/` — получение данных своего профиля и текущей роли (Любой авторизованный пользователь).

### 🏨 Управление отелями (`HotelViewSets`)
* `GET /api/hotels/` — просмотр списка всех гостиниц (Доступно всем).
* `GET /api/hotels/{id}/` — просмотр детальной информации о конкретном отеле (Доступно всем).
* `POST /api/hotels/` — создание новой карточки отеля (Owner, Admin).
* `PUT/PATCH /api/hotels/{id}/` — редактирование информации об отеле (Owner-создатель этого отеля, Admin).
* `DELETE /api/hotels/{id}/` — удаление отеля из системы (Owner-создатель этого отеля, Admin).
* `GET /api/hotels/final_rating/` — получение средней оценки (Любой авторизованный пользователь).

### 🚪 Управление номерами (`RoomViewSets`) — Вложенные REST-эндпоинты
* `GET /api/hotels/{hotel_pk}/rooms/` — просмотр списка всех комнат конкретной гостиницы (Доступно всем).
* `GET /api/hotels/{hotel_pk}/rooms/{id}/` — детальный просмотр конкретного номера в этой гостинице (Доступно всем).
* `POST /api/hotels/{hotel_pk}/rooms/` — добавление номера в текущую гостиницу (Owner данного отеля, Admin). ID отеля берется автоматически из URL.
* `PUT/PATCH /api/hotels/{hotel_pk}/rooms/{id}/` — изменение параметров и цен номера (Owner данного отеля, Admin).
* `DELETE /api/hotels/{hotel_pk}/rooms/{id}/` — удаление номера из сетки отеля (Owner данного отеля, Admin).

### 📅 Бронирования (`BookingViewSets`) — Вложенный REST через комнаты
* `POST /api/rooms/{room_pk}/bookings/` — забронировать текущий номер на определенные даты (Default_user). ID номера берется автоматически из URL.
* `GET /api/bookings/` — список бронирований с ролевой фильтрацией (Default_user видит только свои личные брони; Owner видит брони во всех номерах своих отелей; Admin видит всю базу данных).
* `GET /api/bookings/{id}/` — детальная информация о конкретном бронировании (Создатель брони, Owner отеля, в котором находится номер, Admin).
* `DELETE /api/bookings/{id}/` — отмена и удаление бронирования (Создатель брони, Owner отеля, Admin).
* `GET /api/bookings/final_price/` — расчет стоимости проживания (Участники бронирования, Admin).

### 💬 Отзывы (`ReviewViewSets`)
* `GET /api/reviews/` — просмотр отзывов к отелям (Доступно всем).
* `POST /api/reviews/` — оставить отзыв и поставить оценку отелю (Default_user).
* `PUT/PATCH /api/reviews/{id}/` — редактирование текста своего отзыва (Default_user-автор отзыва).
* `DELETE /api/reviews/{id}/` — удаление отзыва (Автор отзыва, Admin-модератор).
