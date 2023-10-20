import type {
  FilterConditionName,
  ProjectFieldName,
  ProjectsFilterDefinition,
} from './constants';
import {FILTER_CONDITIONS, PROJECT_FIELDS} from './constants';

/**
 * Checks if value is required for given filter condition. If no condition is
 * provided, we assume value is needed (useful when filter is being created
 * in ProjectsFilterEditor, and we want the value input to be available before
 * condition is selected).
 */
export function isFilterConditionValueRequired(
  conditionName?: FilterConditionName
) {
  if (conditionName) {
    const conditionDefinition = FILTER_CONDITIONS[conditionName];
    if (conditionDefinition) {
      return conditionDefinition.requiresValue;
    }
  }
  return true;
}

export function isConditionAvailableForFilter(
  conditionName: FilterConditionName,
  fieldName: ProjectFieldName
) {
  const fieldDefinition = PROJECT_FIELDS[fieldName];
  return fieldDefinition.availableConditions.includes(conditionName);
}

/**
 * Returns a list of only correct filters (e.g. no missing properties allowed).
 */
export function removeIncorrectFilters(filters: ProjectsFilterDefinition[]) {
  const outcome: ProjectsFilterDefinition[] = [];
  filters.forEach((filter) => {
    const isValueRequired = isFilterConditionValueRequired(filter.condition);
    if (
      filter.fieldName &&
      filter.condition &&
      isConditionAvailableForFilter(filter.condition, filter.fieldName) &&
      (!isValueRequired || (isValueRequired && filter.value))
    ) {
      // We rewrite filter object to avoid including value if a non-value
      // condition was selected.
      const cleanFilter: ProjectsFilterDefinition = {
        fieldName: filter.fieldName,
        condition: filter.condition,
      };
      if (isValueRequired) {
        cleanFilter.value = filter.value;
      }
      outcome.push(cleanFilter);
    }
  });
  return outcome;
}

export function buildQueriesFromFilters(filters: ProjectsFilterDefinition[]) {
  return removeIncorrectFilters(filters).map((filter) => {
    // It is not possible to not have these two, since `removeIncorrectFilters`
    // was run over `filters`, but TypeScript needs it.
    if (!filter.fieldName || !filter.condition) {
      return '';
    }
    const fieldDefinition = PROJECT_FIELDS[filter.fieldName];
    const conditionDefinition = FILTER_CONDITIONS[filter.condition];

    if (conditionDefinition.requiresValue && filter.value) {
      return (
        conditionDefinition.filterQuery
          .replace('<field>', fieldDefinition.apiFilteringName)
          // wrapping term in quotes to make it work with spaces
          .replace('<term>', `"${filter.value}"`)
      );
    } else if (!conditionDefinition.requiresValue) {
      return conditionDefinition.filterQuery.replace(
        '<field>',
        fieldDefinition.apiFilteringName
      );
    }

    return '';
  });
}

/**
 * Finds all `q=` queries in the URL and returns an array of them. For example
 * for `?…q=foo AND bar AND…` it would return `['foo', 'bar']`
 */
export function getQueriesFromUrl(url: string): string[] {
  const allQueries = url.slice(url.indexOf('?') + 1).split('&');
  const qQuery = allQueries.find((item) => item.startsWith('q='));
  if (qQuery) {
    return qQuery.replace('q=', '').split('AND');
  }
  return [];
}
