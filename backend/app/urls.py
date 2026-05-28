from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuthRegisterViewSets, HotelViewSets, ReviewViewSets, RoomViewSets, BookingViewSets, DishViewSets, ServiceViewSets

router = DefaultRouter()
router.register('auth', AuthRegisterViewSets, 'auth')
router.register('hotels', HotelViewSets, 'hotels')
router.register('reviews', ReviewViewSets, 'reviews')
router.register('rooms', RoomViewSets, 'rooms')
router.register('bookings', BookingViewSets, 'bookings')
router.register('dishes', DishViewSets, 'dishes')
router.register('services', ServiceViewSets, 'services')



urlpatterns = [
    path('', include(router.urls))
]
