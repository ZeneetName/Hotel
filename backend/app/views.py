from datetime import datetime, date

from django.db.models import ExpressionWrapper, F, Avg, DecimalField, CharField, Value
from django.db.models.functions import Cast, Lower, Replace
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.authentication import authenticate
from rest_framework.authtoken.models import Token
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Hotel, Room, Review, Booking, Dish, Service
from .serializers import (
    BookingSerializer,
    RegistrationSerializer,
    LoginSerializer,
    HotelSerializer,
    ReviewSerializer,
    RoomSerializer,
    DishSerializer,
    ServiceSerializer,
)
from .permission import (
    Create_Get_Reviews,
    CREATEUPDATEDELETE_FOR_OWNERAUTHORS_AND_ADMIN_HOSTEL,
    CREATE_LIST_ROOM_DISH,
    CREATEUPDATEDELETE_FOR_OWNERHOTEL_AND_ADMIN_For_Booking_and_Room,
    CREATE_LIST_ROOM_For_Booking,
    Permission_NO_Create_for_Dish_Service,
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
                return Response({"error": "Пользователь не зарегестрирован или введены некорректные данные"}, status=401)
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


def _recalc_hotel_rating(hotel):
    """Пересчитывает средний рейтинг отеля по оценкам отзывов."""
    avg = hotel.hotel_reviews.aggregate(avg=Avg("score"))["avg"] or 0
    hotel.rating = round(avg, 1)
    hotel.save(update_fields=["rating"])


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
    queryset = Hotel.objects.prefetch_related("hotel_room").all()
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

        # Сортировка: по дате добавления и по рейтингу.
        ordering = request.query_params.get("ordering", "").strip()
        allowed_ordering = {
            "created_at", "-created_at", "rating", "-rating",
        }
        if ordering in allowed_ordering:
            queryset = queryset.order_by(ordering, "-created_at")

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def get_permissions(self):
        if self.action == "list":
            return [AllowAny()]
        if self.action == "final_rating":
            return [AllowAny()]
        if self.action == "room":
            return [CREATE_LIST_ROOM_DISH()]
        if self.action == "reviews":
            return [AllowAny()]
        if self.action == "dish":
            return [CREATE_LIST_ROOM_DISH()]
        return [CREATEUPDATEDELETE_FOR_OWNERAUTHORS_AND_ADMIN_HOSTEL()]

    def perform_create(self, serializer):
        return serializer.save(owner=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        hotel = self.perform_create(serializer)
        
        # Обработка нескольких файлов
        images = request.FILES.getlist('hostel_images')
        if images:
            # Первое изображение сохраняется в основное поле
            hotel.hostel_images = images[0]
            hotel.save()
            # Остальные изображения сохраняются в HotelImage
            for img in images[1:]:
                from .models import HotelImage
                HotelImage.objects.create(hotel=hotel, image=img)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(methods=['get'], detail=False)
    def final_rating(self, request):
        queryset = self.queryset

        data = queryset.aggregate(
            rating=Avg("hotel_reviews__score")
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
                room = serializer.save(hotel=hotel)
                
                # Обработка нескольких файлов
                images = request.FILES.getlist('room_images')
                if images:
                    # Первое изображение сохраняется в основное поле
                    room.room_images = images[0]
                    room.save()
                    # Остальные изображения сохраняются в RoomImage
                    for img in images[1:]:
                        from .models import RoomImage
                        RoomImage.objects.create(room=room, image=img)

                return Response({
                    "detail": 'Успешное создание комнаты',
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

    @action(methods=['POST', 'GET', 'PATCH', 'DELETE'], detail=True)
    def reviews(self, request, pk=None):
        hotel = self.get_object()

        if request.method == 'POST':
            if not request.user.is_authenticated:
                return Response({'error': 'Вы должны быть авторизированы для добавления отзыва'}, status=401)

            serializer = ReviewSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(hotel=hotel, user=request.user)
            _recalc_hotel_rating(hotel)

            return Response({
                'message': 'Отзыв успешно добавлен',
                'data': serializer.data
            }, status=201)

        if request.method == 'GET':
            reviews = Review.objects.filter(hotel=hotel)
            serializer = ReviewSerializer(reviews, many=True)

            return Response({
                'message': f'Отзывы отеля {hotel.title}',
                'data': serializer.data
            })

        if request.method == 'PATCH':
            review_id = request.query_params.get('review_id')
            if not review_id:
                return Response({'error': 'Требуется review_id'}, status=400)

            try:
                review = Review.objects.get(id=review_id, hotel=hotel)
            except Review.DoesNotExist:
                return Response({'error': 'Отзыв не найден'}, status=404)

            if review.user != request.user and request.user.roles != 'Admin':
                return Response({'error': 'Вы можете редактировать только свои отзывы'}, status=403)

            serializer = ReviewSerializer(review, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            _recalc_hotel_rating(hotel)

            return Response({
                'message': 'Отзыв успешно обновлен',
                'data': serializer.data
            })

        if request.method == 'DELETE':
            review_id = request.query_params.get('review_id')
            if not review_id:
                return Response({'error': 'Требуется review_id'}, status=400)

            try:
                review = Review.objects.get(id=review_id, hotel=hotel)
            except Review.DoesNotExist:
                return Response({'error': 'Отзыв не найден'}, status=404)

            if review.user != request.user and request.user.roles != 'Admin':
                return Response({'error': 'Вы можете удалять только свои отзывы'}, status=403)

            review.delete()
            _recalc_hotel_rating(hotel)

            return Response({'message': 'Отзыв удален'}, status=204)

    @action(methods=['POST', 'GET'], detail=True)
    def dish(self, request, pk=None):
        hotel = self.get_object()

        if request.method == "POST":
            if self.request.user.roles != 'Admin' and self.request.user != hotel.owner:
                return Response({
                    'error': 'Вы можете создавать блюда только в своих гостиницех'},
                    status=403)
            serializer = DishSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(hotel=hotel)
            data = serializer.data

            return Response({
                'message': 'Блюдо создано',
                'data': data
            })
        if request.method == "GET":
            dish = Dish.objects.filter(hotel=hotel)
            serializer = DishSerializer(dish, many=True)
            data = serializer.data

            return Response({
                'message': 'Список блюд',
                'data': data
            })

    @action(methods=['POST', 'GET'], detail=True)
    def service(self, request, pk=None):
        hotel = self.get_object()

        if request.method == "POST":
            if self.request.user.roles != 'Admin' and self.request.user != hotel.owner:
                return Response({
                    'error': 'Вы можете создавать услуги только в своих гостиницех'},
                    status=403)
            serializer = ServiceSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(hotel=hotel)
            data = serializer.data

            return Response({
                'message': 'Услуга создана',
                'data': data
            })
        if request.method == "GET":
            services = Service.objects.filter(hotel=hotel)
            serializer = ServiceSerializer(services, many=True)
            data = serializer.data

            return Response({
                'message': 'Список услуг',
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

    @action(methods=['POST', 'GET'], detail=True)
    def booking(self, request, pk=None):
        try:
            room = self.get_object()

            if request.method == 'GET':
                bookings = (
                    Booking.objects
                    .filter(room=room, check_out__gte=date.today())
                    .values('check_in', 'check_out')
                )
                return Response({'data': list(bookings)})

            serializer = BookingSerializer(
                data=request.data,
                context={"room": room, "request": request},
            )
            serializer.is_valid(raise_exception=True)
            serializer.save(room=room, user=request.user)
            data = serializer.data

            return Response({
                'detail': 'Бронь',
                'data': data
            })
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class BookingPagination(PageNumberPagination):
    """Постраничная выдача бронирований (для бесконечной прокрутки у админа)."""
    page_size = 8
    page_size_query_param = 'page_size'
    max_page_size = 50


class BookingViewSets(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated, CREATEUPDATEDELETE_FOR_OWNERHOTEL_AND_ADMIN_For_Booking_and_Room]
    pagination_class = BookingPagination

    def get_queryset(self):
        base = Booking.objects.select_related('room', 'room__hotel', 'user')
        if self.request.user.roles == 'Default_user':
            base = base.filter(user=self.request.user)
        elif self.request.user.roles == 'Owner':
            base = base.filter(room__hotel__owner=self.request.user)

        # Поиск брони по ID (полному или частичному). Сравниваем по тексту
        # UUID без дефисов, чтобы работало и в SQLite, и в PostgreSQL.
        search = self.request.query_params.get('search', '').strip()
        if search:
            needle = search.replace('-', '').lower()
            base = base.annotate(
                id_text=Lower(
                    Replace(Cast('id', CharField(max_length=36)), Value('-'), Value(''))
                )
            ).filter(id_text__icontains=needle)

        return base.order_by('-created_at')

    def perform_create(self, serializer):
        return serializer.save(user=self.request.user)

    @action(methods=['get'], detail=False)
    def final_price(self, request):
        queryset = self.queryset

        data = queryset.values("user").annotate(
            total_price=ExpressionWrapper(F("room__price_on_one_day") * F("total_days"), DecimalField())
        )
        return Response(data)


class ReviewViewSets(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        return serializer.save(user=self.request.user)


class DishViewSets(viewsets.ModelViewSet):
    queryset = Dish.objects.all()
    serializer_class = DishSerializer
    permission_classes = [Permission_NO_Create_for_Dish_Service]

    def get_queryset(self):
        queryset = super().get_queryset()
        hotel_id = self.request.query_params.get('hotel')
        if hotel_id:
            queryset = queryset.filter(hotel_id=hotel_id)
        return queryset


class ServiceViewSets(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [Permission_NO_Create_for_Dish_Service]

    def get_queryset(self):
        queryset = super().get_queryset()
        hotel_id = self.request.query_params.get('hotel')
        if hotel_id:
            queryset = queryset.filter(hotel_id=hotel_id)
        return queryset
