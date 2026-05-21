from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuthRegisterViewSets, HotelViewSets, ReviewViewSets, RoomViewSets, BookingViewSets

router = DefaultRouter()
router.register('auth', AuthRegisterViewSets, 'auth')
router.register('hostel', HotelViewSets, 'hostel')
router.register('reviews', ReviewViewSets, 'reviews')
router.register('room', RoomViewSets, 'room')
router.register('booking', BookingViewSets, 'booking')



urlpatterns = [
    path('', include(router.urls))
]
