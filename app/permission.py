from django.template.context_processors import request
from rest_framework.permissions import BasePermission, SAFE_METHODS


class isVerifyUser(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        return request.user.is_admin


class isHostelOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.owner == request.user

class isReviewOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.user == request.user

class isBookingOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user



class IsHostelOwnerFORRoom(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.hotel.owner == request.user

