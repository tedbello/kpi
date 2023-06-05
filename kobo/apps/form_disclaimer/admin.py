from django.contrib import admin
from django.db import transaction

from kpi.deployment_backends.kc_access.shadow_models import KobocatFormDisclaimer
from .models import (
    FormDisclaimer,
    OverriddenFormDisclaimer,
)
from .forms import FormDisclaimerForm, OverriddenFormDisclaimerForm


class FormDisclaimerAdmin(admin.ModelAdmin):

    form = FormDisclaimerForm
    add_form = FormDisclaimerForm

    list_display = ['get_language', 'default']
    search_fields = ['language__code', 'language__name']
    autocomplete_fields = ['language']
    exclude = ['asset']

    @admin.display(description='Language')
    def get_language(self, obj):
        return f'{obj.language.name} ({obj.language.code})'

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return (
            queryset.filter(asset__isnull=True)
            .select_related('asset', 'language')
            .order_by('-default', 'language__name')
        )

    def delete_queryset(self, request, queryset):
        to_delete_ids = list(queryset.values_list('pk', flat=True))
        with transaction.atomic():
            super().delete_queryset(request, queryset)
            KobocatFormDisclaimer.objects.filter(pk__in=to_delete_ids).delete()


class OverridenFormDisclaimerAdmin(FormDisclaimerAdmin):

    form = OverriddenFormDisclaimerForm
    add_form = OverriddenFormDisclaimerForm

    list_display = ['get_language', 'asset', 'get_status']
    search_fields = [
        'language__code',
        'language__name',
        'asset__name',
        'asset__uid',
        'asset__owner__username',
    ]
    autocomplete_fields = ['language', 'asset']
    exclude = ['default']

    @admin.display(description='Status')
    def get_status(self, obj):
        return 'Override' if obj.message.strip() else 'Hide'

    def get_queryset(self, request):
        queryset = super(FormDisclaimerAdmin, self).get_queryset(request)
        return (
            queryset.filter(
                asset__isnull=False, asset__date_deployed__isnull=False
            )
            .select_related('asset', 'language')
            .order_by('-default', 'language__name')
        )

admin.site.register(FormDisclaimer, FormDisclaimerAdmin)
admin.site.register(OverriddenFormDisclaimer, OverridenFormDisclaimerAdmin)
