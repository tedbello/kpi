import React, {useContext} from 'react';
import styles from './keywordSearchFieldsEditor.module.scss';
import AnalysisQuestionsContext from '../analysisQuestions.context';
import {findQuestion} from 'js/components/processing/analysis/utils';
import TagsInput from 'react-tagsinput';
import Icon from 'js/components/common/icon';
import type {AdditionalFields} from 'js/components/processing/analysis/constants';
import singleProcessingStore from 'js/components/processing/singleProcessingStore';
import TransxSelector from 'js/components/processing/transxSelector';
import type {LanguageCode} from 'js/components/languages/languagesStore';

interface KeywordSearchFieldsEditorProps {
  uid: string;
  fields: AdditionalFields;
  onFieldsChange: (fields: AdditionalFields) => void;
}

export default function KeywordSearchFieldsEditor(
  props: KeywordSearchFieldsEditorProps
) {
  const analysisQuestions = useContext(AnalysisQuestionsContext);

  // Get the question data from state (with safety check)
  const question = findQuestion(props.uid, analysisQuestions?.state);
  if (!question) {
    return null;
  }

  function updateFields(newFields: AdditionalFields) {
    props.onFieldsChange(newFields);
  }

  /**
   * Does a little cleanup of tags:
   * 1. remove whitespace before and after the tag
   * 2. no duplicates (needed in addition to `onlyUnique` option on
   *    `<TagsInput>`, because of whitespace changes)
   */
  function onKeywordsChange(newKeywords: string[]) {
    const cleanTags = Array.from(new Set(newKeywords.map((tag) => tag.trim())));

    updateFields({
      ...props.fields,
      keywords: cleanTags,
    });
  }

  function onSourceChange(newSource: LanguageCode | null) {
    updateFields({
      ...props.fields,
      source: newSource ? newSource : undefined,
    });
  }

  const inputHtmlId = 'keywordSearchFieldsEditor_TagsInput_Input';

  return (
    <div className={styles.root}>
      <section className={styles.left}>
        <label htmlFor={inputHtmlId}>{t('Look for')}</label>

        <a className={styles.helpLink} href={'#TODO'}>
          <Icon name={'information'} size='xs' />
          {t('help')}
        </a>

        <TagsInput
          value={props.fields.keywords || []}
          onChange={onKeywordsChange}
          inputProps={{
            id: inputHtmlId,
            placeholder: t('Type keywords'),
          }}
          onlyUnique
          addOnBlur
          addOnPaste
        />
      </section>

      <section className={styles.right}>
        <label>{t('From file')}</label>

        <TransxSelector
          languageCodes={singleProcessingStore.getSources()}
          selectedLanguage={props.fields.source}
          onChange={onSourceChange}
          // TODO: after PR https://github.com/kobotoolbox/kpi/pull/4423
          // is merged into feature/analysis branch, lets introduce size and
          // color props here, so we can use 'm' 'gray' here
        />
      </section>
    </div>
  );
}
