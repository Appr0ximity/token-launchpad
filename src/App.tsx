import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import './App.css'
import { WalletDisconnectButton, WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { TokenLaunchpad } from './components/TokenLaunchpad'
import '@solana/wallet-adapter-react-ui/styles.css';
function App() {

  const alchemyDevnet = import.meta.env.VITE_ALCHEMY_DEVNET

  return <div className='w-screen h-screen bg-black mx-auto flex flex-col justify-center items-center'>
    <ConnectionProvider endpoint={alchemyDevnet}>
      <WalletProvider wallets={[]}>
        <WalletModalProvider>
          <div>
            <WalletMultiButton />
            <WalletDisconnectButton />
          </div>
          <TokenLaunchpad></TokenLaunchpad>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </div>
}

export default App
