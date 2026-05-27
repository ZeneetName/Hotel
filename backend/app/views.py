from datetime import datetime

from django.db.models import ExpressionWrapper, F, Avg, DecimalField
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.authentication import authenticate
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Hotel, Room, Review, Booking
from .serializers import (
    BookingSerializer,
    RegistrationSerializer,
    LoginSerializer,
    HotelSerializer,
    ReviewSerializer,
    RoomSerializer,
)
from .permission import (
    Create_Get_Reviews,
    CREATEUPDATEDELETE_FOR_OWNERAUTHORS_AND_ADMIN_HOSTEL,
    CREATE_LIST_ROOM,
    CREATEUPDATEDELETE_FOR_OWNERHOTEL_AND_ADMIN_For_Booking_and_Room,
    CREATE_LIST_ROOM_For_Booking,
)
from .utils import busy_room_ids_for_period, hotels_with_available_rooms


class AuthRegisterViewSets(viewsets.ModelViewSet):

    @action(methods=['POST'], detail=False)
    def register(self, request):
        try:
            serializer = RegistrationSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.save()
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'full_name': user.full_name,
                    'roles': user.roles,
                },
                'token': token.key,
                'detail': 'Вы успешно зарегистрировались'
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
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'full_name': user.full_name,
                    'roles': user.roles,
                },
                'token': token.key,
                'detail': 'Вы успешно вошли',
            })
        except Exception as e:
            return Response({"error": str(e)}, status=400)


    @action(methods=['GET'], detail=False, permission_classes=[IsAuthenticated])
    def profile(self, request):
        try:
            return Response({
                'id': request.user.id,
                'username': request.user.username,
                'email': request.user.email,
                'full_name': request.user.full_name,
                'phone': request.user.phone,
                'roles': request.user.roles,
            })
        except Exception as e:
            return Response({'error': str(e)})


def _parse_search_dates(request):
    check_in_raw = request.query_params.get("check_in")
    check_out_raw = request.query_params.get("check_out")
    if not check_in_raw and not check_out_raw:
        return None, None
    if not check_in_raw or not check_out_raw:
        raise ValueError("Укажите обе даты: заезд и выезд")
    try:
        check_in = datetime.strptime(check_in_raw, "%Y-%m-%d").date()
        check_out = datetime.strptime(check_out_raw, "%Y-%m-%d").date()
    except ValueError as exc:
        raise ValueError("Неверный формат дат. Используйте YYYY-MM-DD") from exc
    if check_out <= check_in:
        raise ValueError("Дата выезда должна быть позже даты заезда")
    return check_in, check_out


class HotelViewSets(viewsets.ModelViewSet):
    queryset = Hotel.objects.all()
    serializer_class = HotelSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        city = request.query_params.get("city", "").strip()
        if city:
            queryset = queryset.filter(city__icontains=city)

        try:
            check_in, check_out = _parse_search_dates(request)
        except ValueError as e:
            return Response({"error": str(e)}, status=400)

        if check_in and check_out:
            queryset = hotels_with_available_rooms(queryset, check_in, check_out)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def get_permissions(self):
        if self.action == "list":
            return [AllowAny()]
        if self.action == "final_rating":
            return [AllowAny()]
        if self.action == "room":
            return [CREATE_LIST_ROOM()]
        if self.action == "reviews":
            return [Create_Get_Reviews()]
        return [CREATEUPDATEDELETE_FOR_OWNERAUTHORS_AND_ADMIN_HOSTEL()]

    def perform_create(self, serializer):
        return serializer.save(owner=self.request.user)

    @action(methods=['get'], detail=False)
    def final_rating(self, request):
        queryset = self.queryset

        data = queryset.aggregate(
            rating = Avg("hotel_reviews__score")
        )
        return Response(data)

    @action(methods=['POST', 'GET'], detail=True)
    def room(self, request, pk=None):
        try:
            hotel = self.get_object()
            if request.method == 'POST':

                if self.request.user.roles != 'Admin' and self.request.user != hotel.owner:
                    return Response({'error': 'Вы можете создавать номера только в своих гостиницех'}, status=403)

                serializer = RoomSerializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                serializer.save(hotel=hotel)

                return Response({
                    "detail": 'Успешное создание коматы',
                    "data": serializer.data,
                })
            if request.method == 'GET':
                model = Room.objects.filter(hotel=hotel)
                try:
                    check_in, check_out = _parse_search_dates(request)
                except ValueError as e:
                    return Response({"error": str(e)}, status=400)
                if check_in and check_out:
                    busy = busy_room_ids_for_period(check_in, check_out)
                    model = model.exclude(id__in=busy)

                serializer = RoomSerializer(model, many=True)
                data = serializer.data

                return Response({
                    'detail': 'Список номеров',
                    'data': data
            })
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    @action(methods=['POST', 'GET'], detail=True)
    def reviews(self, request, pk=None):
        hotel = self.get_object()
        if request.method == 'POST':
            serializer = ReviewSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(hotel=hotel, user=self.request.user)
            data = serializer.data

            return Response({
                'massage': 'Отзыв создан',
                'data': data
            })
        if request.method == 'GET':

            reviews = Review.objects.filter(hotel=hotel)
            serializer = ReviewSerializer(reviews, many=True)
            data = serializer.data

            return Response({
                'massage': f'Отзывы {hotel.title}',
                'data': data
            })



class RoomViewSets(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action == "list":
            return [AllowAny()]
        if self.action == "booking":
            return [CREATE_LIST_ROOM_For_Booking()]
        return [CREATEUPDATEDELETE_FOR_OWNERHOTEL_AND_ADMIN_For_Booking_and_Room()]

    @action(methods=['POST'], detail=True)
    def booking(self, request, pk=None):
        try:
            room = self.get_object()
            serializer = BookingSerializer(
                data=request.data,
                context={"room": room, "request": request},
            )
            serializer.is_valid(raise_exception=True)
            serializer.save(room=room, user=request.user)
            data =serializer.data

            return Response({
                'detail': 'Бронь',
                'data': data
            })
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class BookingViewSets(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated, CREATEUPDATEDELETE_FOR_OWNERHOTEL_AND_ADMIN_For_Booking_and_Room]

    def get_queryset(self):
        if self.request.user.roles == 'Default_user':
            return Booking.objects.filter(user=self.request.user)
        if self.request.user.roles == 'Owner':
            return Booking.objects.filter(room__hotel__owner=self.request.user)
        return Booking.objects.all()

    def perform_create(self, serializer):
        return serializer.save(user=self.request.user)

    @action(methods=['get'], detail=False)
    def final_price(self, request):
        queryset = self.queryset

        data = queryset.values("user").annotate(
            total_price = ExpressionWrapper(F("room__price_on_one_day") * F("total_days"), DecimalField())
        )
        return Response(data)


class ReviewViewSets(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        return serializer.save(user=self.request.user)


