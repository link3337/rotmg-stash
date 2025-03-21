import { useLaunchExaltMutation } from '@/api/tauri/tauriApi';
import { RATE_LIMIT_DURATION } from '@/constants';
import { AccountModel } from '@cache/account-model';
import { AccountExportModel, ExportModel } from '@cache/export-model';
import useCrypto from '@hooks/crypto';
import { useAppDispatch, useAppSelector } from '@hooks/redux';
import {
  addAccount,
  changeAccountOrder,
  deleteAccount,
  importAccounts,
  refreshAccount,
  toggleAccountActive,
  updateAccount,
  updateAccounts,
  useAccounts
} from '@store/slices/AccountsSlice';
import { selectRateLimit } from '@store/slices/RateLimitSlice';
import { setSettings, useSettings } from '@store/slices/SettingsSlice';
import { maskEmail } from '@utils/masking';
import { saveAs } from 'file-saver';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Column, ColumnSortEvent } from 'primereact/column';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { DataTable, DataTableRowEditCompleteEvent } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { FileUpload } from 'primereact/fileupload';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import React, { useRef, useState } from 'react';
import PasswordEditor from './PasswordEditor';

export const AccountTable: React.FC = () => {
  const dispatch = useAppDispatch();
  const [launchAccount] = useLaunchExaltMutation();

  const { encrypt, decrypt } = useCrypto();
  const { items: accounts, loading } = useAccounts();
  const settings = useSettings();
  const isStreamerMode = useAppSelector((state) => state.settings.experimental.isStreamerMode);
  const rateLimit = useAppSelector(selectRateLimit);

  const isRateLimited = React.useMemo(() => {
    if (!rateLimit.timestamp) return false;
    return Date.now() - rateLimit.timestamp < RATE_LIMIT_DURATION;
  }, [rateLimit.timestamp]);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [newAccount, setNewAccount] = useState<Partial<AccountModel>>({});
  const [emailError, setEmailError] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  const [showExtraActions, setShowExtraActions] = useState<boolean>(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [pendingImport, setPendingImport] = useState<any>(null);

  const toast = useRef<Toast>(null);
  const fileUploadRef = useRef<FileUpload>(null);

  // Add date formatter template
  const lastFetchedBodyTemplate = (rowData: AccountModel) => {
    if (!rowData.lastSaved) return '-';

    const date = new Date(rowData.lastSaved);
    const formattedDate = new Intl.DateTimeFormat(navigator.language, {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(date);

    return (
      <span className="text-sm" title={date.toLocaleString()}>
        {formattedDate}
      </span>
    );
  };

  const handleAddAccount = async () => {
    if (!newAccount.email || !newAccount.password) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Please fill all fields'
      });
      return;
    }

    const encryptedAccount = {
      ...newAccount,
      password: encrypt(newAccount.password)
    };

    try {
      dispatch(addAccount(encryptedAccount));

      setDialogVisible(false);
      setNewAccount({});

      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Account added successfully'
      });
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to add account'
      });
    }
  };

  const handleDeleteAccount = async (account: AccountModel) => {
    try {
      dispatch(deleteAccount(account.id));

      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Account deleted successfully'
      });
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete account'
      });
    }
  };

  const confirmDelete = (account: AccountModel) => {
    confirmDialog({
      message: `Are you sure you want to delete account ${account.email}?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: () => handleDeleteAccount(account),
      reject: () => {
        toast.current?.show({
          severity: 'info',
          summary: 'Cancelled',
          detail: 'Delete cancelled'
        });
      }
    });
  };

  const onRowEditComplete = async (e: DataTableRowEditCompleteEvent) => {
    try {
      const updatedAccount = { ...e.newData } as AccountModel;
      updatedAccount.password = encrypt(updatedAccount.password);
      await dispatch(updateAccount(updatedAccount));

      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Account updated'
      });
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update account'
      });
    }
  };

  const textEditor = (options: any) => {
    return (
      <InputText
        type="text"
        value={options.value}
        onChange={(e) => options.editorCallback(e.target.value)}
      />
    );
  };

  const passwordBodyTemplate = () => {
    return <span>{'•'.repeat(12)}</span>;
  };

  // Add toggle function
  const toggleActive = (account: AccountModel) => {
    dispatch(toggleAccountActive(account.id));

    toast.current?.show({
      severity: 'success',
      summary: 'Success',
      detail: `Account ${!account.active ? 'activated' : 'deactivated'}`
    });
  };

  // Add new function to handle bulk toggle
  const toggleAllActive = () => {
    const allActive = accounts.every((acc) => acc.active);
    const updatedAccounts = accounts.map((acc) => ({
      ...acc,
      active: !allActive
    }));
    dispatch(updateAccounts(updatedAccounts));
  };

  const refreshAccountData = async (account: AccountModel) => {
    try {
      await dispatch(refreshAccount({ ...account, password: decrypt(account.password) })).unwrap();

      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Account data refreshed'
      });
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to refresh account data'
      });
    }
  };

  const dateSort = (event: ColumnSortEvent) => {
    if (!event?.data) return [];

    return [...event.data].sort((a: AccountModel, b: AccountModel) => {
      const dateA = a.lastSaved ? new Date(a.lastSaved).getTime() : 0;
      const dateB = b.lastSaved ? new Date(b.lastSaved).getTime() : 0;
      return (dateA - dateB) * (event.order ?? 1);
    });
  };

  const moveUp = (index: number) => {
    if (index === 0) return; // Already at the top

    const newAccounts = [...accounts];
    const temp = newAccounts[index - 1];
    newAccounts[index - 1] = newAccounts[index];
    newAccounts[index] = temp;

    dispatch(changeAccountOrder(newAccounts));
  };

  const moveDown = (index: number) => {
    if (index === accounts.length - 1) return; // Already at the bottom

    const newAccounts = [...accounts];
    const temp = newAccounts[index + 1];
    newAccounts[index + 1] = newAccounts[index];
    newAccounts[index] = temp;

    dispatch(changeAccountOrder(newAccounts));
  };

  const moveToTop = (index: number) => {
    if (index === 0) return; // Already at the top

    const newAccounts = [...accounts];
    const [movedAccount] = newAccounts.splice(index, 1);
    newAccounts.unshift(movedAccount);

    dispatch(changeAccountOrder(newAccounts));
  };

  const moveToBottom = (index: number) => {
    if (index === accounts.length - 1) return; // Already at the bottom

    const newAccounts = [...accounts];
    const [movedAccount] = newAccounts.splice(index, 1);
    newAccounts.push(movedAccount);

    dispatch(changeAccountOrder(newAccounts));
  };

  const toggleExtraActions = () => {
    setShowExtraActions((prev) => !prev);
  };

  const launchExalt = async (account: AccountModel) => {
    try {
      const exaltPath = settings?.experimental?.exaltPath;
      const deviceToken = settings?.experimental?.deviceToken;

      if (!exaltPath) {
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Exalt path not set. Please set it in Experimental Settings.'
        });
        return;
      }

      if (!deviceToken) {
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Device token not set. Please set it in Experimental Settings.'
        });
        return;
      }

      await launchAccount({
        exaltPath,
        deviceToken,
        guid: account.email,
        password: decrypt(account.password)
      }).unwrap();

      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Launched RotMG Exalt'
      });
    } catch (error) {
      console.error('Failed to launch Exalt:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to launch RotMG Exalt'
      });
    }
  };

  const actionBodyTemplate = (rowData: AccountModel, { rowIndex }: { rowIndex: number }) => (
    <div className="flex gap-2">
      {settings?.experimental?.exaltPath && settings?.experimental?.deviceToken && (
        <Button
          icon="pi pi-play"
          onClick={() => launchExalt(rowData)}
          className="p-button-success p-button-text p-button-rounded"
          disabled={loading[rowData.id]}
          tooltip="Launch Exalt"
          tooltipOptions={{ position: 'top' }}
        />
      )}
      <Button
        icon={`pi pi-star${rowData.active ? '-fill' : ''}`}
        onClick={() => toggleActive(rowData)}
        className={`p-button-text p-button-rounded ${rowData.active ? 'text-yellow-500' : 'text-gray-500'}`}
        disabled={loading[rowData.id]}
        tooltip={rowData.active ? 'Deactivate' : 'Activate'}
        tooltipOptions={{ position: 'top' }}
      />
      <Button
        icon="pi pi-refresh"
        onClick={() => refreshAccountData(rowData)}
        className="p-button-text p-button-rounded"
        loading={loading[rowData.id]}
        disabled={loading[rowData.id] || isRateLimited}
        tooltip="Refresh"
        tooltipOptions={{ position: 'top' }}
      />
      <Button
        icon="pi pi-trash"
        className="p-button-danger p-button-text p-button-rounded"
        onClick={() => confirmDelete(rowData)}
        disabled={loading[rowData.id]}
        tooltip="Delete"
        tooltipOptions={{ position: 'top' }}
      />
      {showExtraActions && (
        <>
          <Button
            icon="pi pi-arrow-up"
            tooltip="Move Up"
            className="p-button-rounded p-button-text"
            onClick={() => moveUp(rowIndex)}
            disabled={rowIndex === 0}
          />
          <Button
            icon="pi pi-arrow-down"
            tooltip="Move Down"
            className="p-button-rounded p-button-text"
            onClick={() => moveDown(rowIndex)}
            disabled={rowIndex === accounts.length - 1}
          />
          <Button
            icon="pi pi-angle-double-up"
            tooltip="Move to Top"
            className="p-button-rounded p-button-text"
            onClick={() => moveToTop(rowIndex)}
            disabled={rowIndex === 0}
          />
          <Button
            icon="pi pi-angle-double-down"
            tooltip="Move to Bottom"
            className="p-button-rounded p-button-text"
            onClick={() => moveToBottom(rowIndex)}
            disabled={rowIndex === accounts.length - 1}
          />
        </>
      )}
    </div>
  );

  const footer = (
    <div>
      <Button
        label="Cancel"
        icon="pi pi-times"
        onClick={() => setDialogVisible(false)}
        className="p-button-text"
      />
      <Button
        label="Save"
        icon="pi pi-check"
        onClick={handleAddAccount}
        disabled={!isFormValid}
        autoFocus
      />
    </div>
  );

  const importAccountsFromFile = async (event: any) => {
    try {
      const file = event.files[0];
      const text = await file.text();

      if (file.name.endsWith('.json')) {
        // Handle JSON file
        const importJSON: ExportModel = JSON.parse(text);
        const importAccountsRaw = importJSON.accounts;

        setPendingImport(importJSON);
        setShowImportDialog(true);

        const accountsToImport = importAccountsRaw.map((account: any) => ({
          ...account,
          password: encrypt(account.password)
        }));

        dispatch(importAccounts(accountsToImport));
      } else if (file.name.endsWith('.js')) {
        // Handle JS file
        const accountsRegex = /accounts\s*=\s*({[\s\S]*?})/;
        const match = text.match(accountsRegex);

        if (!match?.[1]) {
          throw new Error('No accounts object found in file');
        }

        const importAccountsRaw: { [email: string]: string } = JSON.parse(match[1]);

        const accountsToImport: AccountExportModel[] = Object.entries(importAccountsRaw).map(
          ([email, password]) =>
            ({
              email,
              password: encrypt(password)
            }) as AccountExportModel
        );

        // Dispatch import action
        dispatch(importAccounts(accountsToImport));
      } else {
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Unsupported file type, please use .json or .js files, or contact Lingo'
        });
        throw new Error('Unsupported file type');
      }

      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: `Imported accounts successfully`
      });

      // Clear file input
      fileUploadRef.current?.clear();
    } catch (error) {
      console.error('Import error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to parse accounts file'
      });
    }
  };

  const handleImportConfirm = (confirmed: boolean) => {
    if (confirmed && pendingImport) {
      dispatch(setSettings(pendingImport.settings));

      setShowImportDialog(false);
      setPendingImport(null);
    }
  };

  const validateInput = (input: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const steamworksRegex = /^steamworks:\d{17}$/;

    if (!input) {
      setEmailError('Email or Steam ID is required');
      return false;
    }

    if (input.startsWith('steamworks:')) {
      if (!steamworksRegex.test(input)) {
        setEmailError('Invalid Steam ID format. Example: steamworks:76561198932248564');
        return false;
      }
    } else if (!emailRegex.test(input)) {
      setEmailError('Invalid email format');
      return false;
    }

    setEmailError('');
    return true;
  };

  const validateForm = (account: Partial<AccountModel>) => {
    const emailValid = validateInput(account.email || '');
    const passwordValid = !!account.password && account.password.length > 0;

    setIsFormValid(emailValid && passwordValid);
    return emailValid && passwordValid;
  };

  const handleEmailChange = (value: string) => {
    setNewAccount((prev) => ({ ...prev, email: value }));
    validateForm({ ...newAccount, email: value });
  };

  const handlePasswordChange = (value: string) => {
    setNewAccount((prev) => ({ ...prev, password: value }));
    validateForm({ ...newAccount, password: value });
  };

  const emailBodyTemplate = (rowData: AccountModel) => {
    return isStreamerMode ? maskEmail(rowData.email) : rowData.email;
  };

  const handleExportAccounts = () => {
    const accountsData: AccountExportModel[] = accounts.map((account: AccountModel) => {
      return {
        email: account.email,
        password: decrypt(account.password)
      };
    });

    const accountsExportJson: ExportModel = {
      accounts: accountsData,
      settings: settings
    };

    const jsonContent = JSON.stringify(accountsExportJson, null, 2);

    const blob = new Blob([jsonContent], { type: 'application/json' });
    saveAs(blob, 'accounts.json');
  };

  return (
    <Card>
      <Toast ref={toast} position="bottom-right" />
      <ConfirmDialog />

      <div className="mb-3 flex justify-content-between align-items-center">
        <Button
          icon="pi pi-plus"
          tooltipOptions={{ position: 'top', showDelay: 150 }}
          tooltip="Add Account"
          className={`p-button-rounded`}
          onClick={() => setDialogVisible(true)}
        />

        {/* hide this control and use the upload button to trigger the file upload */}
        <FileUpload
          ref={fileUploadRef}
          mode="basic"
          name="accounts"
          accept=".js,.json"
          maxFileSize={1000000}
          customUpload
          uploadHandler={importAccountsFromFile}
          auto
          style={{ display: 'none' }}
        />

        <div className="flex gap-2">
          <Button
            tooltipOptions={{ position: 'top', showDelay: 150 }}
            tooltip={showExtraActions ? 'Hide extra actions' : 'Show extra actions'}
            icon={`pi pi-cog`}
            className={`mr-1 p-button-rounded ${showExtraActions ? '' : 'p-button-outlined'}`}
            onClick={toggleExtraActions}
          />

          <Button
            tooltipOptions={{ position: 'top', showDelay: 150 }}
            tooltip={accounts.every((acc) => acc.active) ? 'Deactivate All' : 'Activate All'}
            icon={`pi pi-star${accounts.every((acc) => acc.active) ? '-fill' : ''}`}
            className={`mr-1 p-button-rounded p-button-outlined p-button-outlined`}
            onClick={toggleAllActive}
          />

          <Button
            tooltipOptions={{ position: 'top', showDelay: 150 }}
            tooltip="Import Accounts"
            icon="pi pi-upload"
            onClick={() => fileUploadRef.current?.getInput().click()}
            className={`mr-1 p-button-rounded p-button-outlined`}
          />

          <Button
            tooltipOptions={{ position: 'top', showDelay: 150 }}
            tooltip="Export Accounts"
            icon="pi pi-download"
            onClick={handleExportAccounts}
            className={`mr-1 p-button-rounded p-button-outlined`}
          />
        </div>
      </div>

      <DataTable
        value={accounts}
        tableStyle={{ minWidth: '50rem' }}
        editMode="row"
        dataKey="id"
        onRowEditComplete={onRowEditComplete}
        showGridlines
      >
        <Column
          field="email"
          header="Email"
          body={emailBodyTemplate}
          editor={(options) => textEditor(options)}
          sortable
        />
        <Column
          field="password"
          header="Password"
          body={passwordBodyTemplate}
          editor={(options) => (
            <PasswordEditor
              initialValue={options.rowData.password}
              value={options.value}
              editorCallback={options.editorCallback!}
            />
          )}
        />
        <Column
          field="lastFetched"
          header="Last Fetched"
          body={lastFetchedBodyTemplate}
          sortable
          sortFunction={dateSort}
        />
        <Column
          rowEditor
          headerStyle={{ width: '10%', minWidth: '8rem' }}
          bodyStyle={{ textAlign: 'center' }}
        />
        <Column body={actionBodyTemplate} exportable={false} style={{ width: '10rem' }} />
      </DataTable>

      <Dialog
        visible={dialogVisible}
        style={{ width: '32rem' }}
        breakpoints={{ '960px': '75vw', '641px': '90vw' }}
        header="Add Account"
        modal
        className="p-fluid"
        footer={footer}
        onHide={() => setDialogVisible(false)}
      >
        <div className="field">
          <label htmlFor="email" className="font-bold">
            Email or Steam ID
          </label>
          <InputText
            id="email"
            value={newAccount.email}
            onChange={(e) => {
              handleEmailChange(e.target.value);
            }}
            className={emailError ? 'p-invalid' : ''}
            placeholder="Email or steamworks"
            required
            autoFocus
          />
          {emailError && <small className="p-error block">{emailError}</small>}
        </div>
        <div className="field">
          <label htmlFor="password" className="font-bold">
            Password
          </label>
          <InputText
            id="password"
            type="password"
            value={newAccount.password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            required
          />
        </div>
      </Dialog>

      <Dialog
        visible={showImportDialog}
        onHide={() => setShowImportDialog(false)}
        header="Import Settings"
        modal
        footer={
          <div>
            <Button
              label="No"
              icon="pi pi-times"
              onClick={() => handleImportConfirm(false)}
              className="p-button-text"
            />
            <Button
              label="Yes"
              icon="pi pi-check"
              onClick={() => handleImportConfirm(true)}
              autoFocus
            />
          </div>
        }
      >
        <p>Do you want to import settings from the file aswell?</p>
      </Dialog>
    </Card>
  );
};

export default AccountTable;
