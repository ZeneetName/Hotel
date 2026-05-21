from rest_framework import serializers
from .models import CustomAuthenticationUser, Hotel, Room, Review, Booking


class RegistrationSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True)
    phone = serializers.CharField(max_length=12)

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
        if  value[0] != '+' and value[1] != '7':
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
            "type",
            "price_on_one_day",
            "description",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "hotel"]


class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = [
            "id",
            "user",
            "room",
            "check_in",
            "check_out",
            "total_price",
            "created_at",
            "total_days",
        ]
        read_only_fields = ["id", "created_at", "total_price", "total_days", "room", "user"]

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
                from .utils import room_is_available
                if not room_is_available(room, check_in, check_out):
                    raise serializers.ValidationError(
                        "Номер уже забронирован на выбранные даты"
                    )
        return attrs


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = [
            "id",
            "comment_text",
            "hotel",
            "user",
            "created_at",
            "score",
        ]
        read_only_fields = ["id", "created_at", "hotel", "user"]

    def validate_score(self, value):
        if not(1 <= value <= 5):
            raise serializers.ValidationError('Рейтинг должен быть в промежутке от 1 до 5')
        return value

    def validate_text(self, value):
        if len(value) <= 5:
            raise serializers.ValidationError("Напишите полноценный комментарий")



