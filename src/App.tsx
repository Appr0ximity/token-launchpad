import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import './App.css'
import { WalletDisconnectButton, WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { TokenLaunchpad } from './components/TokenLaunchpad'
import '@solana/wallet-adapter-react-ui/styles.css';
function App() {

  const alchemyDevnet = import.meta.env.VITE_ALCHEMY_DEVNET

  return <div className='min-h-screen bg-black text-white'>
    <ConnectionProvider endpoint={alchemyDevnet}>
      <WalletProvider wallets={[]}>
        <WalletModalProvider>
          {/* Header */}
          <div className='flex justify-between items-center px-8 py-6 border-b border-gray-800'>
            <div>
              <h1 className='text-2xl font-semibold text-white'>
                Token Launchpad
              </h1>
              <p className='text-sm text-gray-500 mt-0.5'>Create your token on Solana</p>
            </div>
            <div className='flex gap-3'>
              <WalletMultiButton />
              <WalletDisconnectButton />
            </div>
          </div>
          
          {/* Main Content */}
          <div className='p-8 flex items-center justify-center min-h-[calc(100vh-100px)]'>
            <TokenLaunchpad></TokenLaunchpad>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </div>
}

export default App
