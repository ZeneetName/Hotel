from datetime import date

from .models import Booking, Room

def parse_date_range(check_in, check_out):
    if check_out <= check_in:
        raise ValueError("Дата выезда должна быть позже даты заезда")
    return check_in, check_out


def room_is_available(room, check_in: date, check_out: date) -> bool:
    if check_out <= check_in:
        return False
    return not Booking.objects.filter(
        room=room,
        check_in__lt=check_out,
        check_out__gt=check_in,
    ).exists()


def busy_room_ids_for_period(check_in: date, check_out: date):
    return Booking.objects.filter(
        check_in__lt=check_out,
        check_out__gt=check_in,
    ).values_list("room_id", flat=True)


def hotels_with_available_rooms(hotel_queryset, check_in: date, check_out: date):


    busy = busy_room_ids_for_period(check_in, check_out)
    hotel_ids = (
        Room.objects.filter(hotel__in=hotel_queryset)
        .exclude(id__in=busy)
        .values_list("hotel_id", flat=True)
        .distinct()
    )
    return hotel_queryset.filter(id__in=hotel_ids)

