import Account from '@components/Account/Account';
import Queue from '@components/Queue/Queue';
import Totals from '@components/Totals/Totals';
import { useAppDispatch, useAppSelector } from '@hooks/redux';
import { initializeAccounts, selectActiveAccounts } from '@store/slices/AccountsSlice';
import { selectRateLimit } from '@store/slices/RateLimitSlice';
import React, { useEffect } from 'react';
import { shallowEqual } from 'react-redux';

const MainPage: React.FC = () => {
  const dispatch = useAppDispatch();

  const activeAccounts = useAppSelector(selectActiveAccounts, shallowEqual);
  const showTotals = useAppSelector((state) => state.settings.displaySettings.showTotals);
  const rateLimit = useAppSelector(selectRateLimit);

  useEffect(() => {
    dispatch(initializeAccounts());
  }, [dispatch]);

  return (
    <>
      <Queue accounts={activeAccounts} />
      {showTotals && <Totals accounts={activeAccounts} />}
      {activeAccounts?.map((account) => <Account key={account.id} account={account} isRateLimited={rateLimit.isLimited} />)}
    </>
  );
};

export default MainPage;
