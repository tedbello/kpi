import React, {useState, useEffect} from 'react';
import styles from './usageProjectBreakdown.module.scss';
import $ from 'jquery';
import {ROOT_URL} from 'jsapp/js/constants';
import {Link} from 'react-router-dom';
import {ROUTES} from 'jsapp/js/router/routerConstants';
import AssetStatusBadge from 'jsapp/js/components/common/assetStatusBadge';
import type {ProjectViewAsset} from 'jsapp/js/dataInterface';
import LoadingSpinner from 'jsapp/js/components/common/loadingSpinner';

interface Project {
  count: string;
  next: string | null;
  previous: string | null;
  results: ProjectResult[];
}

interface ProjectResult {
  asset: string;
  uid: string;
  asset__name: string;
  nlp_usage_current_month: {
    total_nlp_asr_seconds: number;
    total_nlp_mt_characters: number;
  };
  nlp_usage_all_time: {
    total_nlp_asr_seconds: number;
    total_nlp_mt_characters: number;
  };
  storage_bytes: number;
  submission_count_current_month: number;
  submission_count_all_time: number;
  assets: ProjectViewAsset;
}

type ButtonType = 'back' | 'forward';

const ProjectBreakdown = () => {
  const [isActiveBack, setIsActiveBack] = useState(false);
  const [isActiveForward, setIsActiveForward] = useState(false);
  const [isComponentMounted, setIsComponentMounted] = useState(true);

  const handleClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    buttonType: ButtonType
  ): void => {
    event.preventDefault();
    setIsActiveBack(buttonType === 'back');
    setIsActiveForward(buttonType === 'forward');
  };

  const [projectData, setProjectData] = useState<Project>({
    count: '0',
    next: null,
    previous: null,
    results: [],
  });

  const onFetchAssetsDone = (data: Project) => {
    if (isComponentMounted) {
      const updatedResults = data.results.map((projectResult) => {
        const assetParts = projectResult.asset.split('/');
        const uid = assetParts[assetParts.length - 2];
        return {
          ...projectResult,
          uid: uid,
        };
      });

      setProjectData((prevData) => {return {...prevData, results: updatedResults};});
    }
  };

  const onFetchAssetsDataDone = (assetsData: any, updatedResults: ProjectResult[]) => {
    if (isComponentMounted) {
      const updatedData = updatedResults.map((projectResult) => {
        const matchingAsset = assetsData.results.find(
          (asset: ProjectViewAsset) => asset.uid === projectResult.uid
        );

        if (matchingAsset) {
          return {
            ...projectResult,
            assets: [matchingAsset],
          };
        }
        return projectResult;
      });

      setProjectData((prevData: Project) => {
        return {
          ...prevData,
          results: updatedData as ProjectResult[],
        };
      });
    }
  };

  useEffect(() => {
    const usageUrl = `${ROOT_URL}/api/v2/asset_usage`;

    const fetchData = $.ajax({
      dataType: 'json',
      method: 'GET',
      url: usageUrl,
    })
      .done(onFetchAssetsDone)
      .then(() => {
        const assetsUrl = `${ROOT_URL}/api/v2/assets`;

        return $.ajax({
          dataType: 'json',
          method: 'GET',
          url: assetsUrl,
        })
          .done((assetsData) =>
            onFetchAssetsDataDone(assetsData, projectData.results)
          )
          .fail(onAnyFail);
      })
      .fail(onAnyFail);

    return () => {
      setIsComponentMounted(false);
    };

    function onAnyFail(error: any) {
      console.error('Error fetching data:', error);
    }
  }, [projectData.results]);

  if (projectData.results.length === 0 || projectData.results.some((result) => !result.assets)) {
    return <div className={styles.loading}>{<LoadingSpinner/>}</div>;
  }

  return (
    <div className={styles.root}>
      <table>
        <thead>
            <tr>
            <th className={styles.projects}>{t('##count## Projects').replace('##count##', projectData.count)}</th>
            <th>{t('Submissions (Total)')}</th>
            <th>{t('Submissions (This billing period)')}</th>
            <th>{t('Data Storage')}</th>
            <th>{t('Transcript Minutes')}</th>
            <th>{t('Translation characters')}</th>
            <th>{t('Status')}</th>
          </tr>
        </thead>

        <tbody>
             {projectData.results.map((project) => (
           <tr key={project.asset}>
              <td>
                <Link className={styles.link} to={ROUTES.FORM_SUMMARY.replace(':uid', project.uid)}>
                  {project.asset__name}
                </Link>
              </td>
              <td>{project.submission_count_all_time}</td>
              <td className={styles.currentMonth}>{project.submission_count_current_month}</td>
              <td>{project.storage_bytes}</td>
              <td>{project.nlp_usage_current_month.total_nlp_asr_seconds}</td>
              <td>{project.nlp_usage_current_month.total_nlp_mt_characters}</td>
              {/* <td>{<AssetStatusBadge asset={project.assets}>}</td> */}
            </tr>
          ))}
        </tbody>
        <tfoot>
            <div className={styles.pagination}>
            <button className={`${isActiveBack ? styles.active : ''}`} onClick={(e) => handleClick(e, 'back')}>
             <i className='k-icon k-icon-arrow-left' />
            </button>
            <span className={styles.range}>{'1-8 of 57'}</span>
            <button className={`${isActiveForward ? styles.active : ''}`} onClick={(e) => handleClick(e, 'forward')}>
              <i className='k-icon k-icon-arrow-right' />
            </button>
          </div>
        </tfoot>
      </table>
    </div>
  );
};

export default ProjectBreakdown;
