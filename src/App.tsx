import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import './App.css'
import { WalletDisconnectButton, WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { TokenLaunchpad } from './components/TokenLaunchpad'
import '@solana/wallet-adapter-react-ui/styles.css';
function App() {

  const alchemyDevnet = import.meta.env.VITE_ALCHEMY_DEVNET

  return <div className='min-h-screen bg-black'>
    <ConnectionProvider endpoint={alchemyDevnet}>
      <WalletProvider wallets={[]}>
        <WalletModalProvider>
          {/* Header */}
          <div className='sticky top-0 z-50 w-full border-b border-gray-800 bg-black/95 backdrop-blur'>
            <div className='max-w-7xl mx-auto flex h-16 items-center justify-between px-8'>
              <div className='flex items-center gap-2'>
                <div className='flex flex-col'>
                  <h1 className='text-xl font-semibold text-white' style={{textShadow: '0 0 20px rgba(56, 189, 248, 0.3)'}}>
                    Token Launchpad
                  </h1>
                  <p className='text-xs text-gray-400'>Solana SPL Token Creator</p>
                </div>
              </div>
              <div className='flex gap-3'>
                <WalletMultiButton />
                <WalletDisconnectButton />
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className='w-full px-8 py-12 flex items-center justify-center min-h-[calc(100vh-64px)]'>
            <TokenLaunchpad></TokenLaunchpad>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </div>
}

export default App
