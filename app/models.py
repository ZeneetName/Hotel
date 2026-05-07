from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
import uuid

class Manager(BaseUserManager):
    def create_user(self, email, password=None, **kwargs):
        if not email:
            raise ValueError('Отсутствует email')
        email = self.normalize_email(email)
        user = self.model(email=email, **kwargs)
        user.set_password(password)
        user.save(using=self._db)
        return user


class CustomAuthenticationUser(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, verbose_name='Почта')
    full_name  = models.CharField(max_length=64, unique=True, verbose_name='Польное имя')
    phone  = models.CharField(max_length=256, unique=True, verbose_name='Номер телефона')
    is_admin = models.BooleanField(default=False, verbose_name='админ?')

    username = None
    objects = Manager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []



class Hotel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(CustomAuthenticationUser, on_delete=models.CASCADE, related_name='owner', verbose_name='Владелец')
    hostel_images = models.ImageField(unique=True, verbose_name='Фотошрафии')
    title = models.CharField(max_length=128, unique=True, verbose_name='Название')
    description = models.TextField(verbose_name='Описание отеля')
    address = models.TextField(verbose_name='Адрес')
    rating = models.FloatField(default=0.0, verbose_name='Рейтинг')
    created_at = models.DateField(auto_now_add=True, verbose_name='Дата создания отеля')

    def __str__(self):
        return f'Владелец гостиницы {self.owner} владее гостиницей {self.title} с рейтингом {self.rating}'

TYPE = [
    ('standard', 'Стандартный'),
    ('deluxe', 'Люкс')
]

class Room(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='hotel_room',  verbose_name='Отель')
    room_images = models.ImageField(unique=True, verbose_name='Фотограции номера')
    type  = models.CharField(choices=TYPE, verbose_name='Тип номера')
    price_on_one_day = models.IntegerField(verbose_name='Цена номера за день')
    description = models.TextField(verbose_name='Описание номера')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='врумя создания команты')

    def __str__(self):
        return f'Номера {self.type} стоит {self.price_on_one_day}'

class Booking(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(CustomAuthenticationUser, on_delete=models.CASCADE, related_name='user_booking', verbose_name='Пользователь')
    room = models.ForeignKey(Room, on_delete=models.CASCADE,related_name='room_booking',  verbose_name='Номер бронирования')
    check_in  = models.DateField(verbose_name='Дата заезда')
    check_out  = models.DateField(verbose_name='Дата выезда')
    total_price = models.IntegerField(verbose_name='Итоговая цена', default=0)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='врумя создания бронирования')
    total_days = models.SmallIntegerField(default=0, verbose_name='количество дней')


    def save(self, *args, **kwargs):
        if self.check_in and self.check_out:
            day = self.check_out - self.check_in
            self.total_days = day.days
        super().save(*args, **kwargs)

    def __str__(self):
        return f'Пользователь {self.user} забронировал с {self.check_in} до {self.check_out}'

class Review(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='hotel_reviews', verbose_name='Отель')
    user = models.ForeignKey(CustomAuthenticationUser, on_delete=models.CASCADE, related_name='user_reviews', verbose_name='Пользователь')
    text = models.TextField(verbose_name='Тект комментария')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='врумя создания комментария')
    score = models.SmallIntegerField(verbose_name='рейтинг')


    def __str__(self):
        return f'Пользователь {self.user} отсавил отзыв: {self.text} гостинице {self.hotel}'
