import React, {useState, useEffect} from 'react';
import Button from 'js/components/common/button';
import envStore from 'js/envStore';
import sessionStore from 'js/stores/session';
import {fetchGetUrl} from 'js/api';
import styles from './tosForm.module.scss';
import type {FailResponse} from '../dataInterface';
import type {TOSGetResponse} from './tos.constants';
import {handleApiFail} from '../utils';
import LoadingSpinner from '../components/common/loadingSpinner';
import Checkbox from '../components/common/checkbox';
import {buildTOSFormFields} from './tos.utils';
import type {TOSFormField} from './tos.utils';

export default function TOSForm() {
  // Initialize:
  // 1. get required fields from envStore
  // 2. get data for fields from session store
  // 3. get tos text from new endpoint

  // endpoint:
  // https://kobo-tos.free.beeceptor.com/
  // GET --> TOSResponse
  // POST --> TOSPostResponse

  // when submitting form:
  // 1. make call to session to update missing required fields
  // 2. make call to new endpoint to accept TOS
  // After "Accept" button is clicked, this will be true until the call(s) resolve

  const [isFormPending, setIsFormPending] = useState(false);
  const [message, setMessage] = useState<string | undefined>();
  const [newsletterEnabled, setNewsletterEnabled] = useState(false);
  const [fields, setFields] = useState<TOSFormField[] | undefined>(undefined);

  // Get TOS message from endpoint
  useEffect(() => {
    const getTOS = async () => {
      try {
        const response = await fetchGetUrl<TOSGetResponse>(
          'https://kobo-tos.free.beeceptor.com'
        );
        setMessage(response.text);
      } catch (error) {
        const errorObj = error as FailResponse;
        handleApiFail(errorObj);
      }
    };
    getTOS();
  }, []);

  useEffect(() => {
    if ('email' in sessionStore.currentAccount) {
      console.log('envStore or sessionStore is ready', buildTOSFormFields(sessionStore.currentAccount, envStore.data));
      setFields(buildTOSFormFields(sessionStore.currentAccount, envStore.data));
    }
  }, [envStore.isReady, sessionStore.isAuthStateKnown]);

  function submitForm(evt: React.FormEvent<HTMLFormElement>) {
    evt.preventDefault();
    setIsFormPending(true);
    console.log('submit!');
  }

  function leaveForm() {
    setIsFormPending(true);
    sessionStore.logOut();
  }

  // We are waiting for few pieces of data: the message, fields definitions from
  // environment endpoint and fields data from me endpoint
  if (!message) {
    return <LoadingSpinner hideMessage />;
  }

  return (
    <form className={styles.root} onSubmit={submitForm}>
      <section
        className={styles.message}
        dangerouslySetInnerHTML={{
          __html: message,
        }}
      />

      <section className={styles.metaFields}>
        <h2 className={styles.fieldsHeader}>
          {t('Please make sure the following details are filled out correctly:')}
        </h2>

        <div>HERE RENDER FIELDS</div>

        <Checkbox
          checked={newsletterEnabled}
          disabled={isFormPending}
          onChange={setNewsletterEnabled}
          label={'I want to receive occasional updates'}
        />
      </section>

      <footer className={styles.footer}>
        <Button
          type={'full'}
          color={'blue'}
          size={'l'}
          isSubmit
          isFullWidth
          isDisabled={isFormPending}
          label={t("I Agree, let's go")}
        />

        <Button
          type={'bare'}
          color={'dark-blue'}
          size={'l'}
          isFullWidth
          isDisabled={isFormPending}
          label={t("I don't agree, log me out")}
          onClick={leaveForm}
        />
      </footer>
    </form>
  );
}
