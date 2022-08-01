# coding: utf-8
import json
import logging

import constance
from django.conf import settings
from django.utils.translation import gettext_lazy as t
from markdown import markdown
from rest_framework.response import Response
from rest_framework.views import APIView

from kobo.static_lists import (
    COUNTRIES,
    LANGUAGES,
    TRANSCRIPTION_LANGUAGES,
    TRANSLATION_LANGUAGES
)
from kobo.apps.hook.constants import SUBMISSION_PLACEHOLDER


def _check_asr_mt_access_for_user(user):
    # This is for proof-of-concept testing and will be replaced with proper
    # quotas and accounting
    if user.is_anonymous:
        return False
    asr_mt_invitees = constance.config.ASR_MT_INVITEE_USERNAMES
    return (
        asr_mt_invitees.strip() == '*'
        or user.username in asr_mt_invitees.split('\n')
    )


class EnvironmentView(APIView):
    """
    GET-only view for certain server-provided configuration data
    """

    CONFIGS_TO_EXPOSE = [
        'TERMS_OF_SERVICE_URL',
        'PRIVACY_POLICY_URL',
        'SOURCE_CODE_URL',
        'SUPPORT_EMAIL',
        'SUPPORT_URL',
        'COMMUNITY_URL',
        'FRONTEND_MIN_RETRY_TIME',
        'FRONTEND_MAX_RETRY_TIME',
        ('PROJECT_METADATA_FIELDS', json.loads),
        ('USER_METADATA_FIELDS', json.loads),
        (
            'SECTOR_CHOICES',
            # Intentional t() call on dynamic string because the default
            # choices are translated (see static_lists.py)
            # \n vs \r\n - In django-constance <2.7.0, new lines were saved as "\r\n"
            # Starting in 2.8, new lines are saved as just "\n". In order to ensure compatibility
            # for data saved in older versions, we treat \n as the way to split lines. Then,
            # strip the \r off. There is no reason to do this for new constance settings
            lambda text: tuple((line.strip('\r'), t(line.strip('\r'))) for line in text.split('\n')),
        ),
        (
            'OPERATIONAL_PURPOSE_CHOICES',
            lambda text: tuple((line.strip('\r'), line.strip('\r')) for line in text.split('\n')),
        ),
        (
            'MFA_LOCALIZED_HELP_TEXT',
            lambda i18n_texts: {
                lang: markdown(text)
                for lang, text in json.loads(
                    i18n_texts.replace(
                        '##support email##', constance.config.SUPPORT_EMAIL
                    )
                ).items()
            },
        ),
        'MFA_ENABLED',
    ]

    def get(self, request, *args, **kwargs):
        """
        Return the lowercased key and value of each setting in
        `CONFIGS_TO_EXPOSE`, along with the static lists of sectors, countries,
        all known languages, and languages for which the interface has
        translations.
        """
        data = {}
        for key_or_key_and_callable in self.CONFIGS_TO_EXPOSE:
            try:
                key, processor = key_or_key_and_callable
            except ValueError:
                key = key_or_key_and_callable
                processor = None
            value = getattr(constance.config, key)
            if processor:
                try:
                    value = processor(value)
                except json.JSONDecodeError:
                    logging.error(
                        f'Configuration value for `{key}` has invalid JSON'
                    )
                    continue

            data[key.lower()] = value

        asr_mt_invitees = constance.config.ASR_MT_INVITEE_USERNAMES

        data['asr_mt_features_enabled'] = _check_asr_mt_access_for_user(
            request.user
        )
        data['country_choices'] = COUNTRIES
        data['all_languages'] = LANGUAGES
        data['interface_languages'] = settings.LANGUAGES
        data['transcription_languages'] = TRANSCRIPTION_LANGUAGES
        data['translation_languages'] = TRANSLATION_LANGUAGES
        data['submission_placeholder'] = SUBMISSION_PLACEHOLDER
        data['mfa_code_length'] = settings.TRENCH_AUTH['CODE_LENGTH']
        return Response(data)
