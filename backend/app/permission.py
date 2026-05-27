from django.template.context_processors import request
from rest_framework.permissions import SAFE_METHODS, BasePermission



class CREATEUPDATEDELETE_FOR_OWNERAUTHORS_AND_ADMIN_HOSTEL(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.roles in ['Admin', 'Owner']
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return (request.user.roles == "Admin") or (request.user.roles == 'Owner' and obj.owner == request.user)



class CREATE_LIST_ROOM(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.roles in ['Admin', 'Owner']

class CREATE_LIST_ROOM_For_Booking(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_authenticated



class CREATEUPDATEDELETE_FOR_OWNERHOTEL_AND_ADMIN_For_Booking_and_Room(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        if request.method == 'POST':
            return False
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.roles in ['Admin', 'Owner', 'Default_user']

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return (request.user.roles == "Owner" and obj.hotel.owner == request.user) or (request.user.roles == 'Admin')

class Create_Get_Reviews(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.roles in ['Admin', 'Default_user']



class Permission_ReviewViewSets(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        if request.method == 'POST':
            return False
        return request.user.roles in ['Admin', 'Default_user']

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return (request.user.roles == "Default_user" and obj.user == request.user) or (request.user.roles == 'Admin')
