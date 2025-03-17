import { useLaunchExaltMutation } from '@/api/tauri/tauriApi';
import { CharListResponseUIModel } from '@api/models/charlist-response-ui-model';
import { AccountModel } from '@cache/account-model';
import useCrypto from '@hooks/crypto';
import { useAppDispatch, useAppSelector } from '@hooks/redux';
import RenderIfVisible from '@hooks/renderIfVisible';
import { refreshAccount, skipAccountFromQueue, useAccounts } from '@store/slices/AccountsSlice';
import { selectSelectedItems } from '@store/slices/FilterSlice';
import { QueueStatus } from '@store/slices/QueueSlice';
import { Card } from 'primereact/card';
import { useMemo } from 'react';
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
  const [launchAccount] = useLaunchExaltMutation();

  const { decrypt } = useCrypto();

  const activeFilters = useAppSelector(selectSelectedItems);
  const { loading } = useAccounts();

  const data = account?.mappedData as CharListResponseUIModel;

  const settings = useAppSelector((state) => state.settings);
  const isConfigOpen = useAppSelector((state) => state.layout.isSettingsOpen);

  const renderVisibleProps = useMemo(
    () => ({
      visibleOffset: settings.experimental.lazyLoadingOffset,
      defaultHeight: settings.experimental.lazyLoadingHeight
    }),
    [settings.experimental.lazyLoadingOffset, settings.experimental.lazyLoadingHeight, isConfigOpen]
  );

  const hasFilteredItems = () => {
    if (!activeFilters.length) return true; // no filters active
    return data?.account?.uniqueItems.some((item) => activeFilters.includes(item));
  };

  const handleLaunch = async () => {
    const exaltPath = settings.experimental.exaltPath;
    const deviceToken = settings.experimental.deviceToken;

    if (!exaltPath || !deviceToken) {
      console.error('Exalt path or device token not set in settings');
      return;
    }

    await launchAccount({
      exaltPath,
      deviceToken,
      guid: account.email,
      password: decrypt(account.password)
    }).unwrap();
  };

  const handleRefresh = async () => {
    await dispatch(refreshAccount({ ...account, password: decrypt(account.password) })).unwrap();
  };

  const handleSkipQueue = async () => {
    const newStatus =
      account?.queueStatus == QueueStatus.SKIPPED ? QueueStatus.PENDING : QueueStatus.SKIPPED;
    await dispatch(
      skipAccountFromQueue({
        accountId: account.id,
        newStatus
      })
    ).unwrap();
  };

  if (!hasFilteredItems()) {
    return <></>;
  }

  const AccountContent = () => (
    <Card className="m-2">
      {!data && !loading[account.id] && (
        <>
          <div className={styles.accountinfoContainer} style={{ width: '100%' }}>
            <div className={styles.header}>
              <div>{settings.experimental.isStreamerMode ? account.id : account.email}</div>
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
            loading={loading[account.id]}
            accountData={data.account}
            characters={data.charList}
            characterAmount={data.charList?.length}
            characterMaxAmount={data.maxNumChars}
            refreshButtonClicked={handleRefresh}
            skipQueueButtonClicked={handleSkipQueue}
            launchButtonClicked={handleLaunch}
            showAccountInfo={settings.displaySettings.showAccountInfo}
            isRateLimited={isRateLimited}
          />
          {settings.displaySettings.showExalts && (
            <div className="pt-3">
              <Exalts exalts={data?.exalts} />
            </div>
          )}
          {settings.displaySettings.showCharacters && (
            <div className="pt-3">
              <Characters
                accountId={account.id}
                characters={data.charList}
                classStats={data?.account?.classStats}
                exalts={data?.exalts}
              />
            </div>
          )}
          <VaultOverview account={data.account} />
        </>
      )}
    </Card>
  );

  return settings?.experimental?.lazyLoading ? (
    <RenderIfVisible
      keepRendered={settings.experimental.lazyLoadingKeepRendered}
      {...(!isConfigOpen ? renderVisibleProps : {})}
    >
      <AccountContent />
    </RenderIfVisible>
  ) : (
    <AccountContent />
  );
};

export default Account;
