from rest_framework import serializers
from app.models import CustomAuthenticationUser, Hotel, Room, Review, Booking


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
            "is_admin",
            "password",
        ]

        read_only_fields = ['id', 'is_admin']


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
            "rating",
            "created_at",

        ]

        read_only_fields = ["id", "created_at", "rating"]

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
        read_only_fields = ["id", "created_at"]


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
        ]
        read_only_fields = ["id", "created_at", "total_price"]

class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = [
            "id",
            "hotel",
            "user",
            "text",
            "created_at",
            "score",
        ]
        read_only_fields = ["id", "created_at"]




