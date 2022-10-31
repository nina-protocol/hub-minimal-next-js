import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import {
  WalletModalProvider,
} from '@solana/wallet-adapter-react-ui';
import SnackbarProvider from 'react-simple-snackbar'

import '@solana/wallet-adapter-react-ui/styles.css'
import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  const network = WalletAdapterNetwork.MainnetBeta;
  const endpoint = useMemo(() => {
    return process.env.SOLANA_CLUSTER_URL;
  }, [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <SnackbarProvider>
            <Component {...pageProps} />
          </SnackbarProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default MyApp
