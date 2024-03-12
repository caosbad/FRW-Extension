import React, { useEffect, useState } from 'react';
import { makeStyles, styled } from '@mui/styles';
import { Box, ThemeProvider } from '@mui/system';
import {
  Button,
  Typography,
  IconButton,
  Alert,
  Snackbar,
  Link,
  Input,
  InputAdornment,
  FormGroup,
  LinearProgress,
  CssBaseline,
} from '@mui/material';
import CancelIcon from '../../../../components/iconfont/IconClose';
import CheckCircleIcon from '../../../../components/iconfont/IconCheckmark';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { Presets } from 'react-component-transition';
import zxcvbn from 'zxcvbn';
import theme from '../../../style/LLTheme';
import { useWallet, getHashAlgo, getSignAlgo } from 'ui/utils';
import { AccountKey } from 'background/service/networkModel';
import HDWallet from 'ethereum-hdwallet';
import { LLSpinner } from 'ui/FRWComponent';
import { storage } from '@/background/webapi';


const useStyles = makeStyles(() => ({
  customInputLabel: {
    '& legend': {
      visibility: 'visible',
    },
  },
  inputBox: {
    height: '64px',
    padding: '16px',
    zIndex: '999',
    backgroundColor: '#282828',
    border: '2px solid #4C4C4C',
    borderRadius: '12px',
    boxSizing: 'border-box',
    '&.Mui-focused': {
      border: '2px solid #FAFAFA',
      boxShadow: '0px 8px 12px 4px rgba(76, 76, 76, 0.24)',
    },
  },
  inputBox2: {
    height: '64px',
    padding: '16px',
    zIndex: '999',
    backgroundColor: '#282828',
    border: '2px solid #4C4C4C',
    borderRadius: '12px',
    boxSizing: 'border-box',
    '&.Mui-focused': {
      border: '2px solid #FAFAFA',
      boxShadow: '0px 8px 12px 4px rgba(76, 76, 76, 0.24)',
    },
  },
}));

const BpIcon = styled('span')(() => ({
  borderRadius: 8,
  width: 24,
  height: 24,
  border: '1px solid #41CC5D',
  backgroundColor: 'transparent',
}));

const BpCheckedIcon = styled(BpIcon)({
  backgroundColor: '#41CC5D',
  backgroundImage:
    'linear-gradient(180deg,hsla(0,0%,100%,.1),hsla(0,0%,100%,0))',
  '&:before': {
    display: 'block',
    width: 21,
    height: 21,
    backgroundImage:
      "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath" +
      " fill-rule='evenodd' clip-rule='evenodd' d='M12 5c-.28 0-.53.11-.71.29L7 9.59l-2.29-2.3a1.003 " +
      "1.003 0 00-1.42 1.42l3 3c.18.18.43.29.71.29s.53-.11.71-.29l5-5A1.003 1.003 0 0012 5z' fill='%23fff'/%3E%3C/svg%3E\")",
    content: '""',
  },
  'input:hover ~ &': {
    backgroundColor: '#41CC5D',
  },
});

const PasswordIndicator = (props) => {
  const score = zxcvbn(props.value).score;
  const precentage = ((score + 1) / 5) * 100;

  const level = (score) => {
    switch (score) {
      case 0:
      case 1:
        return { text: chrome.i18n.getMessage('Weak'), color: 'error' };
      case 2:
        return { text: chrome.i18n.getMessage('Good'), color: 'testnet' };
      case 3:
        return { text: chrome.i18n.getMessage('Great'), color: 'success' };
      case 4:
        return { text: chrome.i18n.getMessage('Strong'), color: 'success' };
      default:
        return { text: chrome.i18n.getMessage('Unknown'), color: 'error' };
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '72px', mr: 1 }}>
        <LinearProgress
          variant="determinate"
          // @ts-expect-error level function returned expected value
          color={level(score).color}
          sx={{ height: '12px', width: '72px', borderRadius: '12px' }}
          value={precentage}
        />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="text.secondary">
          {level(score).text}
        </Typography>
      </Box>
    </Box>
  );
};

const SetPassword = ({ handleClick, mnemonic, pk, username, setExPassword, accounts, goEnd }) => {
  const classes = useStyles();
  const wallet = useWallet();

  const [isPasswordVisible, setPasswordVisible] = useState(false);

  const [password, setPassword] = useState('');
  const [isCharacters, setCharacters] = useState(false);
  const [isCheck, setCheck] = useState(false);
  const [isLoading, setLoading] = useState(false);
  // TODO: FIX ME
  const [notBot, setNotBot] = useState(true);

  const [errMessage, setErrorMessage] = useState('Something wrong, please try again');
  const [showError, setShowError] = useState(false);

  const handleErrorClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setShowError(false);
  };

  

  const loadTempPassword = async () => {
    const temp = await storage.get('tempPassword');
    if (temp) {
      setPassword(temp);
    }
  };

  useEffect(() => {
    loadTempPassword();
  }, []);

  const successInfo = (message) => {
    return (
      <Box
        sx={{
          width: '95%',
          backgroundColor: 'success.light',
          mx: 'auto',
          borderRadius: '0 0 12px 12px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <CheckCircleIcon
          size={24}
          color={'#41CC5D'}
          style={{ margin: '8px' }}
        />
        <Typography variant="body1" color="success.main">
          {message}
        </Typography>
      </Box>
    );
  };

  const errorInfo = (message) => {
    return (
      <Box
        sx={{
          width: '95%',
          backgroundColor: 'error.light',
          mx: 'auto',
          borderRadius: '0 0 12px 12px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <CancelIcon size={24} color={'#E54040'} style={{ margin: '8px' }} />
        <Typography variant="body1" color="error.main">
          {message}
        </Typography>
      </Box>
    );
  };

  const [helperText, setHelperText] = useState(<div />);

  const handleImport = async () => {
    console.log('account key ', accounts)
    setLoading(true);
    if (accounts.length > 1) {
      setLoading(true);
    } else {
      const accountKeyStruct = {
        public_key: accounts[0].pubK,
        sign_algo: getSignAlgo(accounts[0].signAlgo),
        hash_algo: getHashAlgo(accounts[0].hashAlgo),
        weight: 1000
      }
      const result = await wallet.openapi.getLocation();
      const installationId = await wallet.openapi.getInstallationId();
      // console.log('location ', userlocation);
      const userlocation = result.data
      const device_info = {
        'city': userlocation.city,
        'continent': userlocation.country,
        'continentCode': userlocation.countryCode,
        'country': userlocation.country,
        'countryCode': userlocation.countryCode,
        'currency': userlocation.countryCode,
        device_id: installationId,
        'district': '',
        'ip': userlocation.query,
        'isp': userlocation.as,
        'lat': userlocation.lat,
        'lon': userlocation.lon,
        'name': 'FRW Chrome Extension',
        'org': userlocation.org,
        'regionName': userlocation.regionName,
        'type': '2',
        'user_agent': 'Chrome',
        'zip': userlocation.zip,
      }
      const address = accounts[0].address.replace(/^0x/, '');
      wallet.openapi.importKey(accountKeyStruct, device_info, username, {}, address)
        .then((response) => {
          return wallet.boot(password);
        })
        .then(async (response) => {
          setExPassword(password);
          storage.remove('premnemonic');

          const loggedInAccounts = await storage.get('loggedInAccounts');
          let lastIndex;
      
          if (!loggedInAccounts || loggedInAccounts.length === 0) {
            lastIndex = 0;
          } else {
            lastIndex = loggedInAccounts.length;
          }
          console.log(' loggedInAccount ', lastIndex, loggedInAccounts);
          await storage.set('currentAccountIndex', lastIndex);
          if (pk) {
            return wallet.importPrivateKey(pk);
          } else {
            return wallet.createKeyringWithMnemonics(mnemonic);
          }
        })
        .then((address) => {
          setLoading(false);
          if (pk) {
            goEnd();
          } else {
            handleClick();

          }
        })
        .catch((error) => {
          console.log('error', error);
          setShowError(true)
          setLoading(false);
        });

    }
  };

  useEffect(() => {
    if (password.length > 7) {
      setHelperText(successInfo(chrome.i18n.getMessage('At__least__8__characters')));
      setCharacters(true);
    } else {
      setHelperText(errorInfo(chrome.i18n.getMessage('At__least__8__characters')));
      setCharacters(false);
    }
  }, [password]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        className="registerBox"
      >
        <Typography variant="h4">
          {chrome.i18n.getMessage('Create')}
          <Box display="inline" color="primary.main">
            {chrome.i18n.getMessage('Password')}
          </Box>{' '}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {chrome.i18n.getMessage('Lilico__uses__this__password__to__protect__your__recovery__phrase')}
        </Typography>

        <Box
          sx={{
            flexGrow: 1,
            width: 640,
            maxWidth: '100%',
            my: '32px',
            display: 'flex',
          }}
        >
          <FormGroup sx={{ width: '100%' }}>
            <Input
              id="pass"
              type={isPasswordVisible ? 'text' : 'password'}
              name="password"
              placeholder={chrome.i18n.getMessage('Create__a__password')}
              value={password}
              className={classes.inputBox}
              fullWidth
              disableUnderline
              readOnly
              endAdornment={
                <InputAdornment position="end">
                  {password && <PasswordIndicator value={password} />}
                  <IconButton
                    onClick={() => setPasswordVisible(!isPasswordVisible)}
                  >
                    {isPasswordVisible ? (
                      <VisibilityOffIcon />
                    ) : (
                      <VisibilityIcon />
                    )}
                  </IconButton>
                </InputAdornment>
              }
            />
            <Presets.TransitionSlideUp
              style={{ marginBottom: '24px' }}>
              {password && helperText}
            </Presets.TransitionSlideUp>
          </FormGroup>
        </Box>

        <FormControlLabel
          control={
            <Checkbox
              icon={<BpIcon />}
              checkedIcon={<BpCheckedIcon />}
              onChange={(event) => setCheck(event.target.checked)}
            />
          }
          label={
            <Typography variant="body1" color="text.secondary">
              {chrome.i18n.getMessage('I__agree__to__Lilico') + ' '}
              <Link underline="none" href="https://lilico.app/about/privacy-policy" target="_blank" color="success.main">
                {chrome.i18n.getMessage('Privacy__Policy')}
              </Link>{' '}
              {chrome.i18n.getMessage('and') + ' '}
              <Link
                href="https://lilico.app/about/terms"
                target="_blank"
                color="success.main"
                underline="none"
              >
                {chrome.i18n.getMessage('Terms__of__Service')}
              </Link>{' '}.
            </Typography>
          }
        />
        <Button
          className="registerButton"
          variant="contained"
          color="secondary"
          onClick={handleImport}
          size="large"
          sx={{
            height: '56px',
            width: '640px',
            borderRadius: '12px',
            textTransform: 'capitalize',
            gap: '12px',
            display: 'flex'
          }}
          disabled={
            isLoading ? true : !(isCharacters && isCheck && notBot)
          }
        >
          {isLoading && <LLSpinner size={28} />}
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 'bold' }}
            color="background.paper"
          >
            {chrome.i18n.getMessage('Register')}
          </Typography>
        </Button>
      </Box>
      <Snackbar open={showError} autoHideDuration={6000} onClose={handleErrorClose}>
        <Alert onClose={handleErrorClose} variant="filled" severity="error" sx={{ width: '100%' }}>
          {errMessage}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default SetPassword;