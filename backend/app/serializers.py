import json
import re

from rest_framework import serializers
from .models import Dish, Service, CustomAuthenticationUser, Hotel, Room, Review, Booking
from .utils import room_is_available


class AmenitiesField(serializers.JSONField):

    def to_internal_value(self, data):
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except ValueError:
                raise serializers.ValidationError("Некорректный формат удобств")
        if not isinstance(data, list):
            raise serializers.ValidationError("Удобства должны быть списком")
        return [str(item) for item in data]


class RegistrationSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    phone = serializers.CharField(required=True)
    roles = serializers.ChoiceField(
        choices=[("Default_user", "Default_user"), ("Owner", "Owner")],
        required=False,
        default="Default_user",
    )

    class Meta:
        model = CustomAuthenticationUser
        fields = [
            "id",
            "email",
            "full_name",
            "phone",
            "password",
            "roles"
        ]

        read_only_fields = ['id']

    def validate_password(self, value):
        if len(value) < 5:
            raise serializers.ValidationError("Пароль должен быть больше 5 символов")
        return value

    def validate_phone(self, value):
        if not value:
            raise serializers.ValidationError("Укажите номер телефона")
        digits = re.sub(r"\D", "", value)
        if digits.startswith("8"):
            digits = "7" + digits[1:]
        if not digits.startswith("7") or len(digits) != 11:
            raise serializers.ValidationError(
                "Введите корректный номер телефона: +7 и ещё 10 цифр"
            )
        return "+" + digits

    def create(self, validated_data):
        return CustomAuthenticationUser.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True)

class HotelSerializer(serializers.ModelSerializer):
    owner_full_name = serializers.CharField(source="owner.full_name", read_only=True)
    owner_phone = serializers.CharField(source="owner.phone", read_only=True)
    min_price = serializers.SerializerMethodField()
    max_price = serializers.SerializerMethodField()
    amenities = serializers.SerializerMethodField()

    def get_min_price(self, obj):
        prices = [room.price_on_one_day for room in obj.hotel_room.all()]
        return min(prices) if prices else 0

    def get_max_price(self, obj):
        prices = [room.price_on_one_day for room in obj.hotel_room.all()]
        return max(prices) if prices else 0

    def get_amenities(self, obj):
        keys = []
        for room in obj.hotel_room.all():
            for key in (room.amenities or []):
                if key not in keys:
                    keys.append(key)
        return keys

    class Meta:
        model = Hotel
        fields = [
            "id",
            "owner",
            "owner_full_name",
            "owner_phone",
            "hostel_images",
            "title",
            "description",
            "address",
            "city",
            "rating",
            "min_price",
            "max_price",
            "amenities",
            "created_at",
        ]

        def validate_title(self, value):
            if len(value) <= 1:
                raise serializers.ValidationError("Название отеля должно быть больше 1 символа")


        read_only_fields = ["id", "created_at", "rating", "owner", "owner_full_name", "owner_phone"]

class RoomSerializer(serializers.ModelSerializer):
    images = serializers.SerializerMethodField()
    amenities = AmenitiesField(required=False)

    class Meta:
        model = Room
        fields = [
            "id",
            "hotel",
            "room_images",
            "images",
            "title",
            "type",
            "price_on_one_day",
            "max_place",
            "square",
            "description",
            "amenities",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "hotel", "images"]

    def get_images(self, obj):
        urls = []
        if obj.room_images:
            urls.append(obj.room_images.url)
        for extra in obj.images.all():
            if extra.image:
                urls.append(extra.image.url)
        return urls


class BookingSerializer(serializers.ModelSerializer):
    room_title = serializers.CharField(source="room.title", read_only=True)
    hotel_name = serializers.CharField(source="room.hotel.title", read_only=True)
    user_name = serializers.CharField(source="user.full_name", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)
    user_phone = serializers.CharField(source="user.phone", read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "user",
            "user_name",
            "user_email",
            "user_phone",
            "room",
            "room_title",
            "hotel_name",
            "check_in",
            "check_out",
            "total_price",
            "created_at",
            "total_days",
        ]
        read_only_fields = ["id", "created_at", "total_price", "total_days", "room", "user", "room_title", "hotel_name", "user_name", "user_email", "user_phone"]

    def validate(self, attrs):
        check_in = attrs.get("check_in") or getattr(self.instance, "check_in", None)
        check_out = attrs.get("check_out") or getattr(self.instance, "check_out", None)
        if check_in and check_out:
            if check_out <= check_in:
                raise serializers.ValidationError(
                    {"check_out": "Дата выезда должна быть позже даты заезда"}
                )
            room = self.context.get("room")
            if room is not None:
                if not room_is_available(room, check_in, check_out):
                    raise serializers.ValidationError(
                        "Номер уже забронирован на выбранные даты"
                    )
        return attrs


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.full_name", read_only=True)
    user_id = serializers.CharField(source="user.id", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "comment_text",
            "hotel",
            "user",
            "user_name",
            "user_id",
            "created_at",
            "score",
        ]
        read_only_fields = ["id", "created_at", "hotel", "user", "user_name", "user_id"]

    def validate_score(self, value):
        if not(1 <= value <= 5):
            raise serializers.ValidationError('Рейтинг должен быть в промежутке от 1 до 5')
        return value

    def validate_comment_text(self, value):
        if len(value) < 3:
            raise serializers.ValidationError("Отзыв должен содержать минимум 3 символа")
        return value



class DishSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dish
        fields = [
            "id",
            "hotel",
            "dish_images",
            "title",
            "composition",
            "weight",
            "price",
        ]
        read_only_fields = ["id", "hotel"]


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = [
            "id",
            "hotel",
            "service_images",
            "title",
            "price",
            "duration",
        ]

        read_only_fields = ["id", "hotel"]
