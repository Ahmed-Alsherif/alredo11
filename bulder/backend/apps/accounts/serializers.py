from rest_framework import serializers

from .models import AgentProfile, DriverProfile, EmployeeDocument, User


class UserSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    first_name = serializers.SerializerMethodField()
    last_name = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    zone = serializers.SerializerMethodField()
    zone_name = serializers.SerializerMethodField()
    is_active_employee = serializers.SerializerMethodField()
    is_paused = serializers.SerializerMethodField()
    subscriber_id = serializers.SerializerMethodField()
    subscription_id = serializers.SerializerMethodField()
    subscription_code = serializers.SerializerMethodField()
    plan_name = serializers.SerializerMethodField()
    subscription_end = serializers.SerializerMethodField()
    color_status = serializers.SerializerMethodField()
    collection_days = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'phone',
            'role', 'role_display', 'zone', 'zone_name', 'is_active_employee',
            'is_paused', 'subscriber_id', 'subscription_id', 'subscription_code',
            'plan_name', 'subscription_end', 'color_status', 'collection_days',
        ]
        read_only_fields = ['id']

    def get_first_name(self, obj):
        return getattr(obj.profile, 'first_name', '') if obj.profile else ''

    def get_last_name(self, obj):
        return getattr(obj.profile, 'last_name', '') if obj.profile else ''

    def get_phone(self, obj):
        return obj.profile_phone

    def get_zone(self, obj):
        zone = obj.profile_zone
        return zone.id if zone else None

    def get_zone_name(self, obj):
        return obj.profile_zone_name

    def get_is_active_employee(self, obj):
        return obj.is_active_employee

    def get_is_paused(self, obj):
        return getattr(obj.profile, 'is_paused', False) if obj.role == User.Role.SUBSCRIBER else False

    def get_subscriber_id(self, obj):
        return getattr(obj.profile, 'id', None) if obj.role == User.Role.SUBSCRIBER else None

    def get_subscription_id(self, obj):
        return self.get_subscription_code(obj)

    def get_subscription_code(self, obj):
        return getattr(obj.profile, 'subscription_id', None) if obj.role == User.Role.SUBSCRIBER else None

    def get_plan_name(self, obj):
        profile = obj.profile
        return profile.plan.name if obj.role == User.Role.SUBSCRIBER and profile and profile.plan else ''

    def get_subscription_end(self, obj):
        profile = obj.profile
        return str(profile.subscription_end) if obj.role == User.Role.SUBSCRIBER and profile and profile.subscription_end else None

    def get_color_status(self, obj):
        return getattr(obj.profile, 'color_status', None) if obj.role == User.Role.SUBSCRIBER else None

    def get_collection_days(self, obj):
        zone = obj.profile_zone
        if not zone:
            return []
        route = zone.routes.filter(status='active').first()
        return route.collection_days if route else []


class DriverProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DriverProfile
        fields = ['first_name', 'last_name', 'phone', 'zone', 'license_number', 'truck_number', 'is_active']


class AgentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgentProfile
        fields = ['first_name', 'last_name', 'phone', 'zone', 'custody_amount', 'is_active']


class EmployeeDocumentSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.display_name', read_only=True)

    class Meta:
        model = EmployeeDocument
        fields = '__all__'


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=4)
    email = serializers.EmailField(required=False, allow_blank=True, default='')
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    zone = serializers.IntegerField(required=False, allow_null=True, write_only=True)
    license_number = serializers.CharField(required=False, write_only=True, allow_blank=True, default='')
    truck_number = serializers.CharField(required=False, write_only=True, allow_blank=True, default='')

    class Meta:
        model = User
        fields = [
            'username', 'password', 'email', 'role', 'first_name', 'last_name',
            'phone', 'zone', 'license_number', 'truck_number',
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')
        first_name = validated_data.pop('first_name', '')
        last_name = validated_data.pop('last_name', '')
        phone = validated_data.pop('phone', '')
        zone_id = validated_data.pop('zone', None)
        license_number = validated_data.pop('license_number', '')
        truck_number = validated_data.pop('truck_number', '')

        username = validated_data.get('username')
        if not validated_data.get('email'):
            validated_data['email'] = f"{username}@example.com"

        user = User(**validated_data)
        user.set_password(password)
        user.is_staff = user.role in (User.Role.ADMIN, User.Role.ACCOUNTANT)
        user.save()

        if user.role == User.Role.DRIVER:
            DriverProfile.objects.create(
                user=user, first_name=first_name, last_name=last_name,
                phone=phone, zone_id=zone_id, license_number=license_number,
                truck_number=truck_number,
            )
        elif user.role == User.Role.AGENT:
            AgentProfile.objects.create(user=user, first_name=first_name, last_name=last_name, phone=phone, zone_id=zone_id)
        elif user.role == User.Role.SUBSCRIBER:
            from apps.subscribers.models import Subscriber

            Subscriber.objects.create(user=user, first_name=first_name, last_name=last_name, phone=phone, zone_id=zone_id)

        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    zone = serializers.IntegerField(required=False, allow_null=True)
    is_active_employee = serializers.BooleanField(required=False)
    license_number = serializers.CharField(required=False, allow_blank=True)
    truck_number = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'role', 'first_name', 'last_name', 'phone',
            'zone', 'is_active_employee', 'license_number', 'truck_number',
        ]

    def update(self, instance, validated_data):
        profile_data = {
            key: validated_data.pop(key)
            for key in list(validated_data.keys())
            if key in ('first_name', 'last_name', 'phone', 'zone', 'is_active_employee', 'license_number', 'truck_number')
        }
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        profile = instance.profile
        if profile:
            for key, value in profile_data.items():
                if key == 'zone':
                    setattr(profile, 'zone_id', value)
                elif key == 'is_active_employee':
                    setattr(profile, 'is_active', value)
                elif hasattr(profile, key):
                    setattr(profile, key, value)
            profile.save()
        return instance


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
