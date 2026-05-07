from django.shortcuts import render
from app.models import CustomAuthenticationUser, Hotel, Room, Review, Booking
from app.serializers import  BookingSerializer, RegistrationSerializer, LoginSerializer, HotelSerializer, ReviewSerializer, RoomSerializer
from app.permission import isVerifyUser, isHostelOwner, isReviewOwner, isBookingOwner, IsHostelOwnerFORRoom
from django.template.context_processors import request
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.authentication import authenticate
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated

class AuthRegisterViewSets(viewsets.ModelViewSet):

    @action(methods=['POST'], detail=False)
    def register(self, request):
        try:
            serializer = RegistrationSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            user = serializer.save()

            return Response({
                'detail': 'Вы успешно зарегестрировались',
                'user': str(user)

            })

        except Exception as e:
            return Response({"error": str(e)}, status=400)

    @action(methods=['POST'], detail=False)
    def login(self, request):
        try:
            serializer = LoginSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            user = authenticate(**serializer.validated_data)
            if not user:
                return Response("Пользователь не зарегестрирован или пароль некорректный")

            token, created = Token.objects.get_or_create(user=user)

            return Response({
                'id': user.id,
                'detail': 'Вы успешно вошли',
                'user': str(user),
                'token': token.key,

            })

        except Exception as e:
            return Response({"error": str(e)}, status=400)

    @action(methods=['GEt'], detail=False)
    def me(self, request):
        try:
            return Response({
                "email": request.user.email,
                "full_name": request.user.full_name,
                "phone": request.user.phone,
            })
        except Exception as e:
            return Response({'error': str(e)})

class HotelViewSets(viewsets.ModelViewSet):
    queryset = Hotel.objects.all()
    serializer_class = HotelSerializer
    permission_classes = [IsAuthenticated, isHostelOwner, isVerifyUser]


    def perform_create(self, serializer):
        return serializer.save(owner=self.request.user)

    def final_rating(self, request):
        queryset = self.queryset

        final_rating = queryset.annotate()


class RoomViewSets(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated, IsHostelOwnerFORRoom]

    def perform_create(self, serializer):
        hotel = serializer.validated_data.get('hotel')

        if hotel.owner != self.request.user:
            return Response({"Вы не можете создавать номера в других гостиницах"})
        serializer.save()

class BookingViewSets(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated, isBookingOwner]

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        return serializer.save(user=self.request.user)

class ReviewViewSets(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated, isReviewOwner]

    def perform_create(self, serializer):
        return serializer.save(user=self.request.user)


