import { useLaunchExaltMutation } from '@/api/tauri/tauriApi';
import { CharListResponseUIModel } from '@api/models/charlist-response-ui-model';
import { AccountModel } from '@cache/account-model';
import useCrypto from '@hooks/crypto';
import { useAppDispatch, useAppSelector } from '@hooks/redux';
import RenderIfVisible from '@hooks/renderIfVisible';
import {
  refreshAccount,
  selectAccountLoading,
  skipAccountFromQueue,
  updateAccountLastLaunched
} from '@store/slices/AccountsSlice';
import { selectSelectedItems } from '@store/slices/FilterSlice';
import { QueueStatus } from '@store/slices/QueueSlice';
import { info } from '@tauri-apps/plugin-log';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import React, { useMemo, useState } from 'react';
import Characters from '../Character/Characters';
import VaultOverview from '../Vault/VaultOverview';
import AccountInfo from './AccountInfo';
import styles from './AccountInfo.module.scss';
import Exalts from './Exalts';

interface AccountProps {
  account: AccountModel;
  isRateLimited: boolean;
}

const Account: React.FC<AccountProps> = ({ account, isRateLimited }) => {
  const dispatch = useAppDispatch();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isExaltsExpanded, setIsExaltsExpanded] = useState(false);
  const [isCharactersExpanded, setIsCharactersExpanded] = useState(true);

  const { decrypt } = useCrypto();
  const loading = useAppSelector((state) => selectAccountLoading(state, account.id));

  const [launchAccount] = useLaunchExaltMutation();

  const activeFilters = useAppSelector(selectSelectedItems);

  const settings = useAppSelector((state) => state.settings);
  const isConfigOpen = useAppSelector((state) => state.layout.isSettingsOpen);
  const enableAccountCollapsing = settings.displaySettings.enableAccountCollapsing;
  const accountDisplayName = account.mappedData?.account?.name ?? account.id;

  const data = useMemo(() => {
    return account?.mappedData as CharListResponseUIModel;
  }, [account?.mappedData]);

  const renderVisibleProps = useMemo(
    () => ({
      visibleOffset: settings.experimental.lazyLoadingOffset,
      defaultHeight: settings.experimental.lazyLoadingHeight
    }),
    [settings.experimental.lazyLoadingOffset, settings.experimental.lazyLoadingHeight, isConfigOpen]
  );

  const hasFilteredItems = useMemo(() => {
    if (!activeFilters.length) return true; // no filters active
    if (!data?.account?.uniqueItems?.length) return false;

    const filterSet = new Set(activeFilters);
    return data.account.uniqueItems.some((item) => filterSet.has(item));
  }, [activeFilters, data?.account?.uniqueItems]);

  const handleLaunch = async () => {
    info('Launching account');
    const exaltPath = settings.experimental.exaltPath;
    const deviceToken = settings.experimental.deviceToken;

    if (!exaltPath || !deviceToken) {
      console.error('Exalt path or device token not set in settings');
      return;
    }

    try {
      await launchAccount({
        exaltPath,
        deviceToken,
        guid: account.email,
        password: decrypt(account.password)
      }).unwrap();

      // Update lastLaunched timestamp after successful launch
      dispatch(updateAccountLastLaunched(account.id));
    } catch (error) {
      console.error('Failed to launch account:', error);
    }
  };

  const handleRefresh = async () => {
    info('Refreshing account data');
    await dispatch(refreshAccount({ ...account, password: decrypt(account.password) })).unwrap();
  };

  const handleSkipQueue = async () => {
    info('Skipping account from queue');
    const newStatus =
      account?.queueStatus == QueueStatus.SKIPPED ? QueueStatus.PENDING : QueueStatus.SKIPPED;
    await dispatch(
      skipAccountFromQueue({
        accountId: account.id,
        newStatus
      })
    ).unwrap();
  };

  if (!hasFilteredItems) {
    return <></>;
  }

  const AccountContent = () => (
    <Card>
      {!data && (
        <>
          <div className={styles.accountinfoContainer} style={{ width: '100%' }}>
            <div className={styles.header}>
              <div>{settings.experimental.isStreamerMode ? account.id : account.email}</div>
              <div className="text-center">
                <Button onClick={handleRefresh} disabled={loading}>
                  Fetch Account Data
                </Button>
              </div>
              {account?.error && (
                <div>
                  Data mapping or request failed for account with email/id:
                  {settings?.experimental.isStreamerMode ? account.id : account.email}.
                </div>
              )}
            </div>
          </div>
        </>
      )}
      {data && (
        <>
          <AccountInfo
            account={account}
            loading={loading}
            accountData={data.account}
            characters={data.charList}
            characterAmount={data.charList?.length}
            seasonalCharacterAmount={data.charList?.filter((x) => x.seasonal).length}
            characterMaxAmount={data.maxNumChars}
            refreshButtonClicked={handleRefresh}
            skipQueueButtonClicked={handleSkipQueue}
            launchButtonClicked={handleLaunch}
            showAccountInfo={settings.displaySettings.showAccountInfo}
            isRateLimited={isRateLimited}
          />
          {settings.displaySettings.showExalts && (
            <div className="pt-3">
              {settings.displaySettings.useAccordionMenu ? (
                <div className={styles.accountSection}>
                  <button
                    type="button"
                    className={`${styles.accountSectionToggle} ${isExaltsExpanded ? styles.accountSectionToggleExpanded : ''}`}
                    onClick={() => setIsExaltsExpanded((prev) => !prev)}
                    aria-expanded={isExaltsExpanded}
                    aria-label={`${isExaltsExpanded ? 'Collapse' : 'Expand'} exalts`}
                  >
                    <span className={styles.accountSectionLabel}>Exalts</span>
                    <span
                      className={`pi pi-chevron-right ${styles.accountSectionIcon} ${isExaltsExpanded ? styles.accountSectionIconExpanded : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                  {isExaltsExpanded && (
                    <div className={styles.accountSectionBody}>
                      <Exalts exalts={data?.exalts} />
                    </div>
                  )}
                </div>
              ) : (
                <Exalts exalts={data?.exalts} />
              )}
            </div>
          )}
          {settings.displaySettings.showCharacters && (
            <div className="pt-3">
              {settings.displaySettings.useAccordionMenu ? (
                <div className={styles.accountSection}>
                  <button
                    type="button"
                    className={`${styles.accountSectionToggle} ${isCharactersExpanded ? styles.accountSectionToggleExpanded : ''}`}
                    onClick={() => setIsCharactersExpanded((prev) => !prev)}
                    aria-expanded={isCharactersExpanded}
                    aria-label={`${isCharactersExpanded ? 'Collapse' : 'Expand'} characters`}
                  >
                    <span className={styles.accountSectionLabel}>Characters</span>
                    <span
                      className={`pi pi-chevron-right ${styles.accountSectionIcon} ${isCharactersExpanded ? styles.accountSectionIconExpanded : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                  {isCharactersExpanded && (
                    <div
                      className={`${styles.accountSectionBody} ${styles.accountSectionBodyCharacters}`}
                    >
                      <Characters
                        accountId={account.id}
                        characters={data.charList}
                        classStats={data?.account?.classStats}
                        exalts={data?.exalts}
                        ownedSkins={data?.account?.ownedSkins}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <Characters
                  accountId={account.id}
                  characters={data.charList}
                  classStats={data?.account?.classStats}
                  exalts={data?.exalts}
                  ownedSkins={data?.account?.ownedSkins}
                />
              )}
            </div>
          )}
          <VaultOverview account={data.account} />
        </>
      )}
    </Card>
  );

  const collapsibleContent = settings?.experimental?.lazyLoading ? (
    <RenderIfVisible
      keepRendered={settings.experimental.lazyLoadingKeepRendered}
      {...(!isConfigOpen ? renderVisibleProps : {})}
    >
      <AccountContent />
    </RenderIfVisible>
  ) : (
    <AccountContent />
  );

  if (!enableAccountCollapsing) {
    return <div className={styles.accountNoCollapse}>{collapsibleContent}</div>;
  }

  return (
    <div className={styles.accountContainer}>
      <button
        type="button"
        className={`${styles.accountCollapseToggle} ${isExpanded ? styles.accountCollapseToggleExpanded : ''}`}
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} account ${accountDisplayName}`}
      >
        <span className={styles.accountCollapseLabel}>{accountDisplayName}</span>
        <span
          className={`pi pi-chevron-right ${styles.accountCollapseIcon} ${isExpanded ? styles.accountCollapseIconExpanded : ''}`}
          aria-hidden="true"
        />
      </button>
      {isExpanded && <div className={styles.accountBody}>{collapsibleContent}</div>}
    </div>
  );
};

export default React.memo(Account, (prev, next) => {
  return prev.account === next.account && prev.isRateLimited === next.isRateLimited;
});
