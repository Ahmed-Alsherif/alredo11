from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import EmployeeDocument, User
from .permissions import IsAdmin, IsStaff
from .serializers import EmployeeDocumentSerializer, UserCreateSerializer, UserSerializer, UserUpdateSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        if self.action in ('update', 'partial_update'):
            return UserUpdateSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action == 'register':
            return [AllowAny()]
        if self.action in ('create', 'destroy', 'reset_password'):
            return [IsAdmin()]
        if self.action in ('me', 'change_password'):
            return [IsAuthenticated()]
        return [IsStaff()]

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        data = request.data.copy()
        data['role'] = User.Role.SUBSCRIBER
        serializer = UserCreateSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def me(self, request):
        return Response(UserSerializer(request.user).data)

    @action(detail=False, methods=['get'])
    def staff(self, request):
        staff = User.objects.exclude(role=User.Role.SUBSCRIBER)
        search = request.query_params.get('search')
        if search:
            staff = staff.filter(
                Q(username__icontains=search)
                | Q(driver_profile__first_name__icontains=search)
                | Q(driver_profile__last_name__icontains=search)
                | Q(driver_profile__phone__icontains=search)
                | Q(agent_profile__first_name__icontains=search)
                | Q(agent_profile__last_name__icontains=search)
                | Q(agent_profile__phone__icontains=search)
            ).distinct()
        return Response(UserSerializer(staff, many=True).data)

    @action(detail=False, methods=['get'])
    def drivers(self, request):
        return Response(UserSerializer(User.objects.filter(role=User.Role.DRIVER), many=True).data)

    @action(detail=False, methods=['get'])
    def agents(self, request):
        return Response(UserSerializer(User.objects.filter(role=User.Role.AGENT), many=True).data)

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        user = self.get_object()
        new_password = request.data.get('new_password') or request.data.get('password')
        if not new_password or len(new_password) < 6:
            return Response({'error': 'new_password must be at least 6 characters'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.save(update_fields=['password'])
        return Response({'status': 'password reset'})

    @action(detail=False, methods=['post'])
    def change_password(self, request):
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        if not old_password or not new_password:
            return Response({'error': 'old_password and new_password are required'}, status=status.HTTP_400_BAD_REQUEST)
        if not request.user.check_password(old_password):
            return Response({'error': 'old_password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_password) < 6:
            return Response({'error': 'new_password must be at least 6 characters'}, status=status.HTTP_400_BAD_REQUEST)
        request.user.set_password(new_password)
        request.user.save(update_fields=['password'])
        return Response({'status': 'password changed'})


class EmployeeDocumentViewSet(viewsets.ModelViewSet):
    queryset = EmployeeDocument.objects.select_related('employee').all()
    serializer_class = EmployeeDocumentSerializer

    def get_permissions(self):
        return [IsAdmin()]
