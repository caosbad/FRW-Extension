import { useEffect, useState, useContext } from 'react';
import React from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import SeedPhraseImport from './importComponent/SeedPhrase';
import KeyImport from './importComponent/KeyImport';
import JsonImport from './importComponent/JsonImport';

import ImportAddressModel from '../../../FRWComponent/PopupModal/importAddressModal';

import ErrorModel from '../../../FRWComponent/PopupModal/errorModel';
import { useWallet } from 'ui/utils';
import * as bip39 from 'bip39';
import { storage } from '@/background/webapi';
import { Presets } from 'react-component-transition';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box p={3}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ImportPager = ({ setMnemonic, setPk, setAccounts, accounts, handleClick }) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [isImport, setImport] = useState<any>(false);

  const [mnemonicValid, setMnemonicValid] = useState(true);

  const [addressFound, setAddressFound] = useState(true);
  const [newKey, setKeyNew] = useState(true);
  const wallet = useWallet();

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleImport = async (accountKey?: any) => {
    console.log('account key ', accountKey)
    if (accountKey.length > 1) {
      setAccounts(accountKey);
      setImport(true);
    } else {
      const result = await wallet.openapi.checkImport(accountKey[0].pubK);
      console.log('result ', result)
      if (result.status === 409) {
        setKeyNew(false);
      } else {
        setAccounts(accountKey);
        handleClick();

      }

    }
  };
  const setmnemonic = (mnemonic) => {
    setMnemonic(mnemonic);
    const formatted = mnemonic.trim().split(/\s+/g).join(' ');
    setMnemonicValid(true);
    storage.set('premnemonic', formatted);
  };

  const handleShowModel = (show) => {
    setImport(show)
  };

  const handleAddressSelection = async (address) => {
    console.log('handleAddressSelection ==>', address);
    console.log(
      'handleAddressSelection ==>',
      accounts.filter((account) => account.address === address)[0],
      accounts
    );
    const account = accounts.filter(
      (account) => account.address === address
    )[0];
    console.log('handleAddressSelection ==>', account);
    const result = await wallet.openapi.checkImport(account.pubK);
    if (result.status === 409) {
      setKeyNew(false);
      setImport(false);
    } else {
      setAccounts([account]);
      handleClick();

    }
  };


  const handleRegister = async () => {
    setAddressFound(!addressFound)
  }


  const sxStyles = {
    fontFamily: 'Inter',
    fontSize: '18px',
    fontStyle: 'normal',
    fontWeight: 700,
    lineHeight: '24px',
    letterSpacing: '-0.252px',
    textTransform: 'capitalize'
  };

  return (
    <Box sx={{ padding: '0 16px 16px' }}>
      <Box sx={{ padding: '20px 24px' }}>
        <Typography variant="h4">
          {chrome.i18n.getMessage('Import_Address')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {chrome.i18n.getMessage('Support_Flow_Wallet_and_private_key')}
        </Typography>
      </Box>

      <Tabs value={selectedTab} onChange={handleTabChange} aria-label="simple tabs example" sx={{ padding: '0 24px' }}>
        <Tab sx={sxStyles} label={chrome.i18n.getMessage('Keystore')} />
        <Tab sx={sxStyles} label={chrome.i18n.getMessage('Seed_Phrase')} />
        <Tab sx={sxStyles} label={chrome.i18n.getMessage('Private_Key')} />
      </Tabs>
      <TabPanel value={selectedTab} index={0}>
        <JsonImport onOpen={handleRegister} onImport={handleImport} setPk={setPk} />
      </TabPanel>
      <TabPanel value={selectedTab} index={1}>
        <SeedPhraseImport onOpen={handleRegister} onImport={handleImport} setmnemonic={setmnemonic} />
      </TabPanel>
      <TabPanel value={selectedTab} index={2}>
        <KeyImport onOpen={handleRegister} onImport={handleImport} setPk={setPk} />
      </TabPanel>
      {!addressFound &&
        <ErrorModel
          isOpen={setAddressFound}
          onOpenChange={setAddressFound}
          errorName={chrome.i18n.getMessage('No_Account_found')}
          errorMessage={chrome.i18n.getMessage('We_cant_find')}
        />
      }
      {!newKey &&
        <ErrorModel
          isOpen={setKeyNew}
          onOpenChange={setKeyNew}
          errorName={chrome.i18n.getMessage('Publickey_already_exist')}
          errorMessage={chrome.i18n.getMessage('Please_import_or_register_a_new_key')}
        />
      }

      {isImport &&
        <ImportAddressModel
          accounts={accounts}
          handleAddressSelection={handleAddressSelection}
          isOpen={handleShowModel}
          onOpenChange={handleShowModel}

        />

      }

    </Box>
  );
};

export default ImportPager;