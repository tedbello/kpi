import React, {useState} from 'react';
import ToggleSwitch from 'js/components/common/toggleSwitch';
import envStore from 'js/envStore';
import {HELP_ARTICLE_ANON_SUBMISSIONS_URL, MODAL_TYPES} from 'js/constants';
import Icon from 'js/components/common/icon';
import styles from './anonymousSubmission.module.scss';
import NewFeatureDialog from './newFeatureDialog.component';

interface AnonymousSubmissionProps {
  checked: boolean;
  onChange: (isChecked: boolean) => void;
}

export default function AnonymousSubmission(props: AnonymousSubmissionProps) {
  return (
    <>
      <ToggleSwitch
        checked={props.checked}
        onChange={props.onChange}
        label={t(
          'Allow web submissions to this form without a username and password'
        )}
      />
      <a
        href={envStore.data.support_url + HELP_ARTICLE_ANON_SUBMISSIONS_URL}
        className='right-tooltip wrapped-tooltip'
        target='_blank'
        data-tip={t(
          'Allow anyone to see this form and add submissions. Click the icon to learn more.'
        )}
      >
        <Icon size='s' name='help' color='storm' />
      </a>
    </>
  );
}
