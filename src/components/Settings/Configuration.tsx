import { Dialog } from 'primereact/dialog';
import { TabPanel, TabView } from 'primereact/tabview';
import { About } from './About/About';
import { AccountTable } from './AccountTable/AccountTable';
import styles from './Configuration.module.scss';
import Settings from './Settings';

interface ConfigurationProps {
  visible: boolean;
  onHide: () => void;
}

const Configuration: React.FC<ConfigurationProps> = ({ visible, onHide }) => {
  return (
    <Dialog
      visible={visible}
      style={{ width: '70vw' }}
      modal
      header="Configuration"
      onHide={onHide}
      dismissableMask
      closeOnEscape
    >
      <TabView className={styles.tabPanel}>
        <TabPanel header="Accounts">
          <AccountTable />
        </TabPanel>

        <TabPanel header="Settings">
          <Settings />
        </TabPanel>

        <TabPanel header="About">
          <About />
        </TabPanel>
      </TabView>
    </Dialog>
  );
};

export default Configuration;
