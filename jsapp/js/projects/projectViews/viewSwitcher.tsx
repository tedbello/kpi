import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {observer} from 'mobx-react-lite';
import classNames from 'classnames';
import Icon from 'js/components/common/icon';
import KoboDropdown, {KoboDropdownPlacements} from 'js/components/common/koboDropdown';
import {PROJECTS_ROUTES} from 'js/projects/routes';
import {ROUTES} from 'js/router/routerConstants';
import projectViewsStore from './projectViewsStore';
import styles from './viewSwitcher.module.scss';
import {HOME_VIEW} from './constants';

interface ViewSwitcherProps {
  selectedViewUid: string;
}

function ViewSwitcher(props: ViewSwitcherProps) {
  // We track the menu visibility for the trigger icon.
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [viewsStore] = useState(() => projectViewsStore);
  const navigate = useNavigate();

  const onOptionClick = (viewUid: string) => {
    console.log(viewUid);
    if (viewUid === HOME_VIEW.uid || viewUid === null) {
      // TODO change this to PROJECTS_ROUTES.MY_PROJECTS
      navigate(ROUTES.FORMS);
    } else {
      navigate(PROJECTS_ROUTES.CUSTOM_VIEW.replace(':viewUid', viewUid));
    }
  };

  const getTriggerLabel = () => {
    if (props.selectedViewUid === HOME_VIEW.uid) {
      return HOME_VIEW.name;
    }

    return viewsStore.getView(props.selectedViewUid)?.name;
  };

  const getTriggerCount = () => {
    if (props.selectedViewUid === HOME_VIEW.uid) {
      return null;
    }

    return viewsStore.getView(props.selectedViewUid)?.assets_count;
  };

  if (!viewsStore.isInitialised) {
    return null;
  }

  return (
    <div className={classNames({
      [styles.root]: true,
      [styles['is-menu-visible']]: isMenuVisible,
    })}>
      <KoboDropdown
        name='projects_view_switcher'
        placement={KoboDropdownPlacements['down-left']}
        hideOnMenuClick
        onMenuVisibilityChange={setIsMenuVisible}
        triggerContent={
          <button className={styles.trigger}>
            {getTriggerLabel()}
            {getTriggerCount() !== null &&
              <span className={styles['trigger-badge']}>{getTriggerCount()}</span>
            }
            <Icon
              classNames={[styles['trigger-icon']]}
              size='xxs'
              name={isMenuVisible ? 'caret-up' : 'caret-down'}
            />
          </button>
        }
        menuContent={
          <div className={styles.menu}>
            <button
              key={HOME_VIEW.uid}
              className={styles['menu-option']}
              onClick={() => onOptionClick(HOME_VIEW.uid)}
            >
              {HOME_VIEW.name}
            </button>
            {viewsStore.views.map((view) =>
              <button
                key={view.uid}
                className={styles['menu-option']}
                onClick={() => onOptionClick(view.uid)}
              >
                {view.name}
              </button>
            )}
          </div>
        }
      />
    </div>
  );
}

export default observer(ViewSwitcher);
