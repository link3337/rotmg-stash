import Account from '@components/Account/Account';
import Queue from '@components/Queue/Queue';
import Totals from '@components/Totals/Totals';
import { useAppSelector } from '@hooks/redux';
import { selectActiveAccounts } from '@store/slices/AccountsSlice';
import { selectRateLimit } from '@store/slices/RateLimitSlice';
import React from 'react';
import { shallowEqual } from 'react-redux';

const MainPage: React.FC = () => {
  const activeAccounts = useAppSelector(selectActiveAccounts, shallowEqual);
  const showTotals = useAppSelector((state) => state.settings.displaySettings.showTotals);
  const rateLimit = useAppSelector(selectRateLimit);

  return (
    <>
      <Queue accounts={activeAccounts} />
      {showTotals && <Totals accounts={activeAccounts} />}
      {activeAccounts?.map((account) => (
        <Account key={account.id} account={account} isRateLimited={rateLimit.isLimited} />
      ))}
    </>
  );
};

export default MainPage;
