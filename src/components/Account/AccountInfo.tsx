import { backendErrorMessages, displayErrorMessages } from '@/constants';
import { AccountUIModel } from '@api/models/account-ui-model';
import { CharUIModel } from '@api/models/char-ui-model';
import { AccountModel } from '@cache/account-model';
import { useAppSelector } from '@hooks/redux';
import { getGuildRank } from '@realm/renders/guild';
import { QueueStatus } from '@store/slices/QueueSlice';
import { selectExperimentalSettings, selectShowAccountName } from '@store/slices/SettingsSlice';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tooltip } from 'primereact/tooltip';
import React, { useState } from 'react';
import styles from './AccountInfo.module.scss';
import OwnedSkinsDialog from './OwnedSkinsDialog';

interface AccountInfoProps {
  account: AccountModel;
  accountData?: AccountUIModel | null;
  characters: CharUIModel[];
  loading: boolean;
  characterAmount: number;
  seasonalCharacterAmount: number;
  characterMaxAmount: number;
  refreshButtonClicked: () => void;
  skipQueueButtonClicked: () => void;
  launchButtonClicked(): void;
  showAccountInfo: boolean;
  isRateLimited: boolean;
}

const AccountInfo: React.FC<AccountInfoProps> = ({
  account,
  accountData,
  loading,
  characterAmount,
  seasonalCharacterAmount,
  characterMaxAmount,
  refreshButtonClicked,
  launchButtonClicked,
  skipQueueButtonClicked,
  showAccountInfo,
  isRateLimited
}) => {
  const [showSkinsModal, setShowSkinsModal] = useState(false);
  const showAccountName = useAppSelector(selectShowAccountName);
  const experimentalSettings = useAppSelector(selectExperimentalSettings);

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat(navigator.language, {
      dateStyle: 'short',
      timeStyle: 'medium'
    }).format(new Date(date));
  };

  const getTooltipContent = () => {
    const lastSaved = account?.lastSaved ? formatDate(account.lastSaved) : '-';
    const lastLaunched = account?.lastLaunched ? formatDate(account.lastLaunched) : 'Never';
    return `Last saved: ${lastSaved}\nLast launched: ${lastLaunched}`;
  };

  const usedVaultSlots = accountData?.vault?.filter((item) => item !== -1).length ?? 0;

  const ownedSkinIds = accountData?.ownedSkins?.split(',').filter((id) => id) ?? [];

  const info: { name: string; value: string | number | undefined; onClick?: () => void }[] = [
    { name: 'Account Fame', value: accountData?.fame },
    { name: 'Account Gold', value: accountData?.credits },
    { name: 'Characters', value: `${characterAmount}/${characterMaxAmount}` },
    { name: 'Seasonal Characters', value: seasonalCharacterAmount },
    { name: 'Unique Items', value: accountData?.uniqueItems?.length },
    { name: 'Total Items', value: accountData?.totalItems },
    { name: 'Vault Slots', value: `${usedVaultSlots}/${accountData?.vault?.length}` },
    { name: 'Gift Items', value: accountData?.gifts?.length },
    { name: 'Seasonal Spoils', value: accountData?.seasonalSpoils?.length },
    ...(accountData?.guildName ? [{ name: 'Guild', value: accountData.guildName }] : []),
    ...(accountData?.guildRank
      ? [{ name: 'Guild Rank', value: getGuildRank(accountData.guildRank) }]
      : []),
    {
      name: 'Total Skins Unlocked',
      value: ownedSkinIds.length,
      onClick: () => setShowSkinsModal(true)
    },
    { name: 'Total Alive Fame', value: accountData?.totalAliveFame },
    { name: 'All Time Account Fame', value: accountData?.totalFame }
  ];

  const errorInfo = () => {
    const error: string = account?.error as string;
    if (!error) return null;

    if (error === backendErrorMessages.TRY_AGAIN_LATER) {
      return <>{displayErrorMessages.RATE_LIMITED}</>;
    } else if (error === backendErrorMessages.NO_INTERNET) {
      return <>{displayErrorMessages.NO_INTERNET}</>;
    } else {
      return displayErrorMessages.UNKNOWN_ERROR;
    }
  };

  return (
    <div className={styles.accountinfoContainer}>
      <div className={styles.header}>
        <span className={styles.accountName}>
          <span>{accountData?.starInfo?.stars}</span>
          <span className={styles.star} style={{ color: accountData?.starInfo?.color }}>
            ★
          </span>
          <span>{showAccountName ? accountData?.name : account?.id}</span>
          <Tooltip target={`.tooltip-target-${account?.id}`} content={getTooltipContent()} />
          <span className={`text-sm text-600 tooltip-target-${account?.id}`}>
            Last saved: {account?.lastSaved ? formatDate(account?.lastSaved) : '-'}
          </span>
          {loading && (
            <ProgressSpinner style={{ width: '20px', height: '20px', marginLeft: '8px' }} />
          )}
        </span>
        <div className="flex align-items-center gap-2">
          {errorInfo()}
          {experimentalSettings.deviceToken && experimentalSettings.exaltPath && (
            <Button label="Launch Exalt" onClick={launchButtonClicked} icon="pi pi-play" />
          )}
          <Button
            label={account?.queueStatus === QueueStatus.SKIPPED ? 'Add to Queue' : 'Skip Queue'}
            onClick={skipQueueButtonClicked}
            icon={account?.queueStatus === QueueStatus.SKIPPED ? 'pi pi-plus' : 'pi pi-sign-out'}
          />
          <Button
            label="Refresh"
            disabled={loading || isRateLimited}
            onClick={refreshButtonClicked}
            icon="pi pi-refresh"
          />
        </div>
      </div>

      {showAccountInfo && (
        <div className={styles.statsContainer}>
          {info.map((item, index) => {
            const isInteractive = item.onClick !== undefined;

            if (isInteractive) {
              return (
                <button
                  key={index}
                  type="button"
                  className={`${styles.statItem} ${styles.statButton}`}
                  onClick={item.onClick}
                  aria-label={`Open ${item.name}`}
                >
                  <span className={styles.statName}>{item.name}</span>
                  <span className={styles.statValue}>{item.value}</span>
                </button>
              );
            }

            return (
              <div key={index} className={styles.statItem}>
                <span className={styles.statName}>{item.name}</span>
                <span className={styles.statValue}>{item.value}</span>
              </div>
            );
          })}
        </div>
      )}

      <OwnedSkinsDialog
        visible={showSkinsModal}
        onHide={() => setShowSkinsModal(false)}
        ownedSkinIds={ownedSkinIds}
      />
    </div>
  );
};

export default AccountInfo;
