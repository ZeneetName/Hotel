from rest_framework import serializers
from .models import Dish, Service, CustomAuthenticationUser, Hotel, Room, Review, Booking
from .utils import room_is_available


class RegistrationSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True)
    phone = serializers.CharField(max_length=12, required=False, default="")

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

        read_only_fields = ['id', 'roles']

    def validate_password(self, value):
        if len(value) < 5:
            raise serializers.ValidationError("Пароль должен быть больше 5 символов")
        return value

    def validate_phone(self, value):
        if not (value[0] == '+' and value[1] == '7'):
            raise serializers.ValidationError("Номер телефона должен начинаться с +7")
        if len(value) > 12:
            raise serializers.ValidationError("Номер телефона не должен превышать длину в 12 цифор")
        return value

    def create(self, validated_data):
        return CustomAuthenticationUser.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True)

class HotelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hotel
        fields = [
            "id",
            "owner",
            "hostel_images",
            "title",
            "description",
            "address",
            "city",
            "rating",
            "min_price",
            "created_at",
        ]

        def validate_title(self, value):
            if len(value) <= 1:
                raise serializers.ValidationError("Название отеля должно быть больше 1 символа")


        read_only_fields = ["id", "created_at", "rating", "owner"]

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = [
            "id",
            "hotel",
            "room_images",
            "title",
            "type",
            "price_on_one_day",
            "max_place",
            "square",
            "description",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "hotel"]


class BookingSerializer(serializers.ModelSerializer):
    room_title = serializers.CharField(source="room.title", read_only=True)
    hotel_name = serializers.CharField(source="room.hotel.title", read_only=True)
    
    class Meta:
        model = Booking
        fields = [
            "id",
            "user",
            "room",
            "room_title",
            "hotel_name",
            "check_in",
            "check_out",
            "total_price",
            "created_at",
            "total_days",
        ]
        read_only_fields = ["id", "created_at", "total_price", "total_days", "room", "user", "room_title", "hotel_name"]

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
