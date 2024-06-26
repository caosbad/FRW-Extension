import React, { useState, useEffect } from 'react';
import { Core } from '@walletconnect/core'
import { Web3Wallet, Web3WalletTypes } from '@walletconnect/web3wallet'
import { formatJsonRpcResult } from '@walletconnect/jsonrpc-utils'
import { getSdkError } from '@walletconnect/utils'
import { DeviceInfo, DeviceInfoRequest, AccountKey } from 'background/service/networkModel';
import {
  LLPrimaryButton,
  LLSecondaryButton,
} from 'ui/FRWComponent';

import {
  Typography,
  Box,
  Drawer,
  Link,
  Button,
  InputBase,
  Input,
  InputAdornment,
  Stack,
  Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { styled } from '@mui/material/styles';
import { FCLWalletConnectMethod } from '@/ui/utils/type';
import { useWallet } from 'ui/utils';
import { useForm, FieldValues } from 'react-hook-form';
import micone from '../../../FRWAssets/image/micone.png';
import licon from '../../../FRWAssets/image/licon.png';
import dicon from '../../../FRWAssets/image/dicon.png';
import closeCircle from '../../../FRWAssets/image/closeCircle.png';
import { useHistory } from 'react-router-dom';
import QrScannerComponent from './QrScannerComponent'

const StyledInput = styled(InputBase)(({ theme }) => ({
  zIndex: 1,
  color: (theme.palette as any).text,
  backgroundColor: (theme.palette as any).background.default,
  borderRadius: theme.spacing(2),
  marginTop: theme.spacing(2),
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(2),
    width: '100%',
  },
}));

interface RevokePageProps {
  isAddAddressOpen: boolean;
  handleCloseIconClicked: () => void;
  handleCancelBtnClicked: () => void;
  handleAddBtnClicked: () => void;
}


const WalletConnect = (props: RevokePageProps) => {

  const usewallet = useWallet();

  const history = useHistory();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields, isValid, isDirty, isSubmitting },
  } = useForm({
    mode: 'all',
  });
  const [syncing, setSyncing] = useState(false);
  const [Uri, setUri] = useState('');
  const [showApprove, setShowApprove] = useState<boolean>(false);

  const [namespaceObject, setNamespace] = useState<any>();

  const [proposer, setProposer] = useState<any>();

  const [ID, setId] = useState<any>();

  const [web3wallet, setWeb3Wallet] = useState<any>(null);
  const [showSyncing, setSyncPage] = useState<boolean>(false);


  useEffect(() => {

    const createWeb3Wallet = async () => {
      try {
        const wallet = await Web3Wallet.init({
          core: new Core({
            projectId: process.env.WC_PROJECTID,
          }),
          metadata: {
            name: 'Flow Walllet',
            description: 'Digital wallet created for everyone.',
            url: 'https://fcw-link.lilico.app',
            icons: ['https://fcw-link.lilico.app/logo.png']
          },
        });
        console.log('web3walletadress', wallet);
        setWeb3Wallet(wallet);
      } catch (e) {
        console.error(e);
      }
    };
    createWeb3Wallet();
  }, []);

  async function onSessionProposal({ id, params }: Web3WalletTypes.SessionProposal) {
    console.log('params ', params)
    try {
      // ------- namespaces builder util ------------ //
      const namespaces = Object.entries(params.requiredNamespaces).map(([key, namespace]) => {
        const caip2Namespace = key;
        const proposalNamespace = namespace;
        const accounts = proposalNamespace.chains?.map(chain => `${chain}:0x7e5d2312899dcf9f`) || [];
        return {
          [caip2Namespace]: {
            chains: proposalNamespace.chains,
            accounts: accounts,
            methods: proposalNamespace.methods,
            events: proposalNamespace.events
          }
        };
      })
        .reduce((acc, current) => ({ ...acc, ...current }), {});


      // ------- end namespaces builder util ------------ //
      setNamespace(namespaces);
    } catch (error) {
      console.log('error ', error)
    }
    console.log(' id ', id)
    setProposer(params.proposer.metadata);
    setId(id);
    showApproveWindow();

  }

  async function onSessionRequest({ topic, params, id }: Web3WalletTypes.SessionRequest) {
    console.log('session request ', params)
    if (params.request.method === FCLWalletConnectMethod.accountInfo) {

      try {

        const userInfo = await usewallet.getUserInfo(false);
        const wallet = await usewallet.getUserWallets();
        const address = wallet[0].blockchain[0].address;


        // Respond with an empty message
        const jsonString = {
          'userId': userInfo.user_id,
          'userAvatar': userInfo.avatar,
          'userName': userInfo.username,
          'walletAddress': address
        }
        const response = {
          'method': FCLWalletConnectMethod.accountInfo,
          'data': jsonString,
          status: '',
          message: '',
        };


        const result = JSON.stringify(response);
        console.log('send back account response ', response)
        await web3wallet.respondSessionRequest({ topic, requestId: id, response: formatJsonRpcResult(id, result) });




        // Router.route(to: RouteMap.RestoreLogin.syncDevice(register));
      } catch (error) {
        console.error('[WALLET] Respond Error: [addDeviceInfo]', error);

      }

    }
    if (params.request.method === FCLWalletConnectMethod.addDeviceInfo) {

      try {
        const accountKeyData = params.request.params.data.accountKey;

        console.log('response ', accountKeyData)
        const publicKey = accountKeyData.publicKey || accountKeyData.public_key;
        const signAlgo = accountKeyData.signAlgo || accountKeyData.sign_algo;
        const hashAlgo = accountKeyData.hashAlgo || accountKeyData.hash_algo;

        await usewallet.addKeyToAccount(publicKey, signAlgo, hashAlgo, accountKeyData.weight)

        console.log('response ', params)

        // Extracting and mapping the deviceInfo
        const deviceInfoData = params.request.params.data.deviceInfo;
        const deviceInfo: DeviceInfoRequest = {
          device_id: deviceInfoData.deviceId || deviceInfoData.device_id,
          ip: deviceInfoData.ip,
          name: deviceInfoData.name,
          type: deviceInfoData.type,
          user_agent: deviceInfoData.userAgent || deviceInfoData.user_agent,
          country: deviceInfoData.country,
          countryCode: deviceInfoData.countryCode,
          city: deviceInfoData.city,
          lat: deviceInfoData.lat,
          lon: deviceInfoData.lon,
          timezone: deviceInfoData.timezone,
          zip: deviceInfoData.zip
        };

        // Extracting and mapping the accountKey
        const accountKey: AccountKey = {
          sign_algo: signAlgo,
          public_key: publicKey,
          weight: accountKeyData.weight,
          hash_algo: hashAlgo
        };
        const requestParams: DeviceInfo = {
          account_key: accountKey,
          device_info: deviceInfo
        }
        usewallet.openapi.synceDevice(requestParams)
          .then((res) => {
            console.log('sync response ', res);
            if (res.status === 200) {
              // Wait for 5 seconds before sending the response
              setTimeout(async () => {
                try {
                  const response = formatJsonRpcResult(id, '');
                  await web3wallet.respondSessionRequest({ topic, requestId: id, response });
                  setSyncing(false);
                  setSyncPage(false);
                  setShowApprove(false);

                  props.handleCloseIconClicked();
                } catch (error) {
                  console.error('Error in sending session response:', error);
                }
              }, 5000); // 5000 milliseconds = 5 seconds
            }
          })
          .catch((err) => {
            console.log('Error in syncDevice:', err);
          });



        // Router.route(to: RouteMap.RestoreLogin.syncDevice(register));
      } catch (error) {
        console.error('[WALLET] Respond Error: [addDeviceInfo]', error);

      }

    }


  }

  const handleFilterAndSearch = async (e) => {
    const keyword = e.target.value;
    console.log('keyword', keyword);
    console.log('web3wallet ', web3wallet);

    if (web3wallet) {

      web3wallet.on('session_proposal', onSessionProposal)

      web3wallet.on('session_request', onSessionRequest)
      await web3wallet.pair({ uri: keyword })


    } else {
      console.log('Web3Wallet is not initialized');
    }


  };

  const showApproveWindow = async () => {
    setShowApprove(true)

  };

  const approveProposal = async () => {
    console.log('ID ', ID)
    setSyncing(true);
    await web3wallet.approveSession({
      id: ID,
      namespaces: namespaceObject
    });
  };


  const cancelProposal = async () => {
    console.log('ID ', ID)
    await web3wallet.rejectSession({
      id: ID,
      reason: getSdkError('USER_REJECTED_METHODS')
    })
    props.handleCloseIconClicked();
  };




  const renderContent = () => (
    <Box
      px="18px"
      sx={{
        width: 'auto',
        height: '469px',
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative'
      }}
    >
      <Box
        sx={{ position: 'absolute', right: '18px', top: '18px' }}
        onClick={props.handleCloseIconClicked}
      >
        <img src={closeCircle} style={{ width: '20px', height: '20px', }} />
      </Box>
      <Box
        sx={{ margin: '20px 0' }}
        onClick={props.handleCloseIconClicked}
      >
        <Typography sx={{ fontWeight: '700', fontSize: '18px' }}>Link Mobile Device</Typography>
      </Box>
      <Box sx={{ display: 'flex', gridTemplateColumns: '1fr 1fr 1fr', justifyContent: 'center', alignItems: 'stretch' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img style={{ height: '40px', width: '40px', borderRadius: '30px', backgroundColor: 'text.secondary', objectFit: 'cover' }} src={dicon} />
          <Typography sx={{ fontSize: '14px', color: '#579AF2', fontWeight: '400', width: '100%', pt: '4px', textAlign: 'center' }}>Desktop Device</Typography>
        </Box>
        <img style={{ width: '108px', height: '8px', marginTop: '20px' }} src={licon} />
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img style={{ height: '40px', width: '40px', borderRadius: '30px', backgroundColor: 'text.secondary', objectFit: 'cover' }} src={micone} />
          <Typography sx={{ fontSize: '14px', color: '#579AF2', fontWeight: '400', width: '100%', pt: '4px', textAlign: 'center' }}>Mobile Device</Typography>
        </Box>

      </Box>
      <Box sx={{ marginTop: '24px', width: '339px', height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.12)' }}></Box>

      <Box sx={{ marginTop: '24px' }}>
        <Input
          type="search"
          placeholder={'Pair wc uri'}
          autoFocus
          disableUnderline
          endAdornment={
            <InputAdornment position="end">
              <SearchIcon
                color="primary"
                sx={{ ml: '10px', my: '5px', fontSize: '24px' }}
              />
            </InputAdornment>
          }
          onChange={handleFilterAndSearch}
        />
        {/* <QrScanner
          onDecode={(result) => {
            if (result) {
              const uri = (result as any).text;

              setUri(uri);
            }
          }}
          onError={(error) => console.log(error?.message)}
        /> */}
        <QrScannerComponent />

      </Box>
      <Typography color='error.main' sx={{ margin: '8px auto 60px', color: 'rgba(255, 255, 255, 0.40)', fontSize: '12px', fontWeight: 400, width: '250px' }}>
        Scan QR code to active your mobile device
      </Typography>

    </Box>
  );





  const approveWindow = () => (
    <Box
      px="18px"
      sx={{
        width: 'auto',
        height: '100%',
        background: 'linear-gradient(0deg, #121212, #11271D)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative'
      }}
    >
      <Box
        sx={{ position: 'absolute', right: '18px', top: '18px' }}
        onClick={props.handleCloseIconClicked}
      >
        <img src={closeCircle} style={{ width: '20px', height: '20px', }} />
      </Box>
      <Box
        sx={{ margin: '20px 0' }}
      >
        <Typography sx={{ fontWeight: '700', fontSize: '18px' }}>Wallet Confirmation</Typography>
      </Box>
      {proposer &&



        <Box sx={{
          margin: '18px 18px 0px 18px',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '12px',
          height: '100%'
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', margin: '0 18px 18px', gap: '18px' }}>
            <Divider />
            <Typography sx={{ textAlign: 'center', fontWeight: '700', fontSize: '16px', color: '#E6E6E6' }} >Allow {proposer.name} to connect?</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img style={{ height: '60px', width: '60px', borderRadius: '30px', backgroundColor: 'text.secondary', objectFit: 'cover' }} src={proposer.icons} />
              <Typography sx={{ textAlign: 'center', color: '#BABABA', fontSize: '14px' }}>{proposer.description}</Typography>
            </Box>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" spacing={1} sx={{ paddingBottom: '32px' }}>
            <LLSecondaryButton
              label={chrome.i18n.getMessage('Cancel')}
              fullWidth
              onClick={() => cancelProposal()}
            />
            <LLPrimaryButton
              label={syncing ? 'Approving...' : 'Approve'}
              fullWidth
              type="submit"
              onClick={() => approveProposal()}
            />
          </Stack>
        </Box>
      }


    </Box>


  );


  return (
    <Drawer
      anchor="bottom"
      open={props.isAddAddressOpen}
      transitionDuration={300}
      PaperProps={{
        sx: {
          width: '100%', height: '469px',
          borderRadius: '18px 18px 0px 0px',
        },
      }}
    >
      {showApprove ? approveWindow() : renderContent()}

    </Drawer>
  );
};

export default WalletConnect;
