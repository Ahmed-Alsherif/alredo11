from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import AgentProfile, DriverProfile, User
from apps.finance.models import Payment
from apps.recycling.models import PointsTransaction, RecycleRequest
from apps.subscribers.models import Subscriber, SubscriptionPlan
from apps.subscribers.views import DAYS_MAP
from apps.tracking.models import CollectionVisit
from apps.zones.models import Route, Zone


class FunctionalIntegrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.plan = SubscriptionPlan.objects.create(name='Monthly', duration_months=1, price='100.00')
        self.zone = Zone.objects.create(
            name='Zone A',
            status='active',
            boundaries=[
                {'lat': 0, 'lng': 0},
                {'lat': 0, 'lng': 10},
                {'lat': 10, 'lng': 10},
                {'lat': 10, 'lng': 0},
            ],
        )
        self.admin = User.objects.create_user('admin', 'admin@example.com', 'pass1234', role=User.Role.ADMIN, is_staff=True)
        self.agent = User.objects.create_user('agent', 'agent@example.com', 'pass1234', role=User.Role.AGENT)
        AgentProfile.objects.create(user=self.agent, first_name='Agent', phone='0910000001', zone=self.zone)
        self.driver = User.objects.create_user('driver', 'driver@example.com', 'pass1234', role=User.Role.DRIVER)
        DriverProfile.objects.create(user=self.driver, first_name='Driver', phone='0910000002', zone=self.zone)
        self.sub_user = User.objects.create_user('subscriber', 'subscriber@example.com', 'pass1234', role=User.Role.SUBSCRIBER)
        self.subscriber = Subscriber.objects.create(
            user=self.sub_user,
            first_name='Sub',
            last_name='One',
            phone='0910000003',
            zone=self.zone,
            plan=self.plan,
            latitude=5,
            longitude=5,
        )

    def test_agent_registers_subscriber_only_inside_zone_polygon(self):
        self.client.force_authenticate(self.agent)
        response = self.client.post('/api/subscribers/register_with_gps/', {
            'first_name': 'Inside',
            'phone': '0910000004',
            'latitude': 5,
            'longitude': 5,
            'plan': self.plan.id,
        }, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['zone'], self.zone.id)

        response = self.client.post('/api/subscribers/register_with_gps/', {
            'first_name': 'Outside',
            'phone': '0910000005',
            'latitude': 50,
            'longitude': 50,
        }, format='json')
        self.assertEqual(response.status_code, 400)

    def test_agent_payment_creates_pending_unique_receipt_and_driver_is_blocked(self):
        self.client.force_authenticate(self.agent)
        response = self.client.post('/api/finance/payments/', {
            'subscriber_ref': self.subscriber.subscription_id,
            'amount': '100.00',
        }, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['status'], Payment.Status.PENDING_DEPOSIT)
        self.assertTrue(response.data['receipt_number'].startswith('REC-'))

        self.client.force_authenticate(self.driver)
        response = self.client.post('/api/finance/payments/', {
            'subscriber_ref': self.subscriber.subscription_id,
            'amount': '100.00',
        }, format='json')
        self.assertEqual(response.status_code, 403)

    def test_driver_daily_list_creates_collection_visit_and_updates_status(self):
        today_name = DAYS_MAP[timezone.now().date().weekday()]
        Route.objects.create(zone=self.zone, driver=self.driver, status='active', collection_days=[today_name])
        self.client.force_authenticate(self.driver)

        response = self.client.get('/api/subscribers/daily_list/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        visit_id = response.data['visits'][0]['id']

        response = self.client.post(f'/api/collection-visits/{visit_id}/mark_status/', {'status': CollectionVisit.Status.COLLECTED}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], CollectionVisit.Status.COLLECTED)
        self.assertIsNotNone(CollectionVisit.objects.get(id=visit_id).completed_at)

    def test_recycling_confirmation_awards_points_once(self):
        request = RecycleRequest.objects.create(subscriber=self.subscriber, category=RecycleRequest.Category.PLASTIC, bags_count=2)
        self.client.force_authenticate(self.driver)

        response = self.client.post(f'/api/recycling/{request.id}/confirm/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(PointsTransaction.objects.filter(recycle_request=request).count(), 1)
        self.assertEqual(PointsTransaction.objects.get(recycle_request=request).points, 60)

        response = self.client.post(f'/api/recycling/{request.id}/confirm/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'already confirmed')
        self.assertEqual(PointsTransaction.objects.filter(recycle_request=request).count(), 1)

    def test_report_export_returns_pdf(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get('/api/reports/export/', {'type': 'financial', 'format': 'pdf'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertTrue(response.content.startswith(b'%PDF'))
