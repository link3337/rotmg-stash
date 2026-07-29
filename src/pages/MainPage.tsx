import Account from '@components/Account/Account';
import Queue from '@components/Queue/Queue';
import Totals from '@components/Totals/Totals';
import { useAppDispatch, useAppSelector } from '@hooks/redux';
import {
  clearSnapshotView,
  initializeAccounts,
  selectActiveAccounts,
  selectSnapshotView
} from '@store/slices/AccountsSlice';
import { selectRateLimit } from '@store/slices/RateLimitSlice';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import React from 'react';
import { shallowEqual } from 'react-redux';
import styles from './MainPage.module.scss';

const MainPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const activeAccounts = useAppSelector(selectActiveAccounts, shallowEqual);
  const rateLimit = useAppSelector(selectRateLimit);
  const snapshotView = useAppSelector(selectSnapshotView);
  const toastRef = React.useRef<Toast>(null);
  const [isRestoringSnapshot, setIsRestoringSnapshot] = React.useState(false);

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat(navigator.language, {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(date));
  };

  const handleRestoreSavedData = async () => {
    try {
      setIsRestoringSnapshot(true);
      await dispatch(initializeAccounts()).unwrap();
      dispatch(clearSnapshotView());
      toastRef.current?.show({
        severity: 'success',
        summary: 'Restored',
        detail: 'Returned to the latest saved account data.'
      });
    } catch (error) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to restore saved account data'
      });
    } finally {
      setIsRestoringSnapshot(false);
    }
  };

  return (
    <>
      <Toast ref={toastRef} position="bottom-right" />
      {snapshotView.active && (
        <section className={styles.snapshotBanner} aria-live="polite">
          <div className={styles.snapshotBannerIcon}>
            <i className="pi pi-history" />
          </div>
          <div className={styles.snapshotBannerContent}>
            <div className={styles.snapshotBannerTitle}>
              Viewing a {snapshotView.scope === 'single' ? 'single-account' : 'global'} snapshot
            </div>
            <div className={styles.snapshotBannerMeta}>
              <span className={styles.snapshotBannerName}>{snapshotView.snapshotName}</span>
              {snapshotView.createdAt && <span>Saved {formatDate(snapshotView.createdAt)}</span>}
            </div>
          </div>
          <Button
            label="Return to Saved Data"
            icon="pi pi-undo"
            severity="warning"
            outlined
            loading={isRestoringSnapshot}
            onClick={handleRestoreSavedData}
          />
        </section>
      )}
      {!snapshotView.active && <Queue accounts={activeAccounts} />}
      <Totals accounts={activeAccounts} />
      {activeAccounts?.map((account) => (
        <Account key={account.id} account={account} isRateLimited={rateLimit.isLimited} />
      ))}
    </>
  );
};

export default MainPage;
