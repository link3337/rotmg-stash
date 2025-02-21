import { useAccounts } from '@store/slices/AccountsSlice';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { useState } from 'react';

const DebugPage = () => {
  const { items: accounts } = useAccounts();

  const [index, setIndex] = useState(0);
  const [renderInPre, setRenderInPre] = useState(false);

  if (accounts.length === 0) {
    return (
      <div style={{ color: 'white', padding: '12px' }}>
        <h1>Debug</h1>
        <p>No accounts available to debug.</p>
      </div>
    );
  }

  return (
    <div style={{ color: 'white', padding: '12px' }}>
      <h1>Debug</h1>
      <div>
        <label htmlFor="indexInput" style={{ marginRight: '8px' }}>
          Account Index:
        </label>
        <InputNumber
          id="indexInput"
          value={index}
          onValueChange={(e) => setIndex(Number(e.value))}
          min={0}
          max={accounts.length - 1}
        />
      </div>
      <div>
        <InputSwitch
          id="preToggle"
          checked={renderInPre}
          onChange={(e) => setRenderInPre(e.value)}
        />
        <label htmlFor="preToggle" style={{ marginLeft: '8px' }}>
          Render in &lt;pre&gt;
        </label>
      </div>

      {renderInPre ? (
        <pre style={{ textAlign: 'left' }}>
          {accounts[index]?.mappedData && (
            <div>{JSON.stringify(accounts[index].mappedData, null, 2)}</div>
          )}
        </pre>
      ) : (
        <div style={{ textAlign: 'left' }}>
          {accounts[index]?.mappedData && (
            <div>{JSON.stringify(accounts[index].mappedData, null, 2)}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default DebugPage;
