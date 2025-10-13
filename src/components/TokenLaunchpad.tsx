import { useState } from "react"
import { InputField } from "../ui/InputField"
import { createAssociatedTokenAccountInstruction, createInitializeMetadataPointerInstruction, createInitializeMintInstruction, createMintToInstruction, ExtensionType, getAssociatedTokenAddressSync, getMintLen, LENGTH_SIZE, TOKEN_2022_PROGRAM_ID, TYPE_SIZE } from "@solana/spl-token"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { Keypair, PublicKey, SystemProgram, Transaction} from "@solana/web3.js"
import { createInitializeInstruction, createUpdateFieldInstruction, pack, type TokenMetadata } from "@solana/spl-token-metadata"


export const TokenLaunchpad = ()=>{


    const [formData, setFormData] = useState<{ 
        name: string,
        symbol: string,
        decimals: string,
        initialSupply: string,
        imageUrl: string,
        description: string
     }>({ 
        name: "",
        symbol: "",
        decimals: "",
        initialSupply: "",
        imageUrl: "",
        description: ""
    })
    const {connection} = useConnection()
    const wallet = useWallet()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)


    const createToken = async (
        payerPublicKey: PublicKey,
        freezeAuthority: PublicKey | null,
        decimals: number,
        programId = TOKEN_2022_PROGRAM_ID,
    )=>{
        if(!wallet || wallet ===undefined || !wallet.publicKey){
            return
        }
        if(!wallet.signTransaction){
            alert("Your wallet doesn't allow to sign a transaction! Connect to a wallet which allows signing")
            return
        }

        const mint = Keypair.generate()
        const metaData: TokenMetadata = {
            updateAuthority: wallet.publicKey,
            mint: mint.publicKey,
            name: formData.name,
            symbol: formData.symbol,
            uri: formData.imageUrl,
            additionalMetadata: [["description", formData.description]]
        }

        const descriptionFieldSize = 
        TYPE_SIZE +
        LENGTH_SIZE +
        "description".length +
        formData.description.length;
        const metadataLen = pack(metaData).length
        const mintLen = getMintLen([ExtensionType.MetadataPointer])
        const lamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen + descriptionFieldSize)

        setLoading(true)


        try{
            const initializeMetadataPointerInstruction = createInitializeMetadataPointerInstruction(
                mint.publicKey,
                wallet.publicKey,
                mint.publicKey,
                TOKEN_2022_PROGRAM_ID
            );

            const initializeMintInstruction = createInitializeMintInstruction(
                mint.publicKey,
                decimals,
                wallet.publicKey,
                freezeAuthority,
                TOKEN_2022_PROGRAM_ID
            )

            const initializeMetadataInstruction = createInitializeInstruction({
                programId: TOKEN_2022_PROGRAM_ID,
                metadata: mint.publicKey,
                updateAuthority: wallet.publicKey,
                mint: mint.publicKey,
                mintAuthority: wallet.publicKey,
                name: metaData.name,
                symbol: metaData.symbol,
                uri: metaData.uri
            });

            const updateFieldInstruction = createUpdateFieldInstruction({
                programId: TOKEN_2022_PROGRAM_ID,
                metadata: mint.publicKey,
                updateAuthority: wallet.publicKey,
                field: metaData.additionalMetadata[0][0],
                value: metaData.additionalMetadata[0][1]
            })

            const createAssociatedToken = getAssociatedTokenAddressSync(
                mint.publicKey,
                wallet.publicKey,
                false,
                TOKEN_2022_PROGRAM_ID
            )

            const {blockhash} = await connection.getLatestBlockhash()

            const transaction = new Transaction().add(
                SystemProgram.createAccount({
                    fromPubkey: payerPublicKey,
                    newAccountPubkey: mint.publicKey,
                    space: mintLen,
                    lamports,
                    programId,
                }),
                initializeMetadataPointerInstruction,
                initializeMintInstruction,
                initializeMetadataInstruction,
                updateFieldInstruction
            );

            
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = wallet.publicKey
            transaction.partialSign(mint)

            const signedTransaction = await wallet.signTransaction(transaction)
            const signature = await connection.sendRawTransaction(signedTransaction.serialize())

            alert(`Token creation submitted! Check status: https://explorer.solana.com/tx/${signature}?cluster=devnet`);

            const initialSupply = parseInt(formData.initialSupply) || 0;
            if (initialSupply > 0) {
                const transaction2 = new Transaction().add(
                    createAssociatedTokenAccountInstruction(
                        wallet.publicKey,
                        createAssociatedToken,
                        wallet.publicKey,
                        mint.publicKey,
                        TOKEN_2022_PROGRAM_ID,
                    )
                );
                await wallet.sendTransaction(transaction2, connection);
                
                const mintAmount = initialSupply * Math.pow(10, decimals);
                const transaction3 = new Transaction().add(
                    createMintToInstruction(
                        mint.publicKey,
                        createAssociatedToken,
                        wallet.publicKey,
                        mintAmount,
                        [],
                        TOKEN_2022_PROGRAM_ID
                    )
                );
                await wallet.sendTransaction(transaction3, connection);
            }

            console.log(signature)
            setSuccess(true)
            setTimeout(()=>{
                setSuccess(false)
            },2000)

        }catch(error){
            console.log('Full error object:', error);
            
            if (error && typeof error === 'object' && 'logs' in error) {
                const logs = error.logs as string[] | undefined;
                console.log('Simulation logs:', logs);
                
                if (logs && logs.length > 0) {
                    const lastLog = logs[logs.length - 1];
                    if (lastLog.includes('success')) {
                        alert(`Token created successfully! Mint: ${mint.publicKey.toBase58()}`);
                        setSuccess(true);
                        setTimeout(() => setSuccess(false), 2000);
                        return;
                    }
                }
            }
            
            alert(`Failed to create token: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }finally{
            setLoading(false)
        }


    }
    
    return <div className='w-full max-w-3xl mx-auto space-y-6'>
            {/* Form Section */}
            <div className='bg-[#0d0d0d] border border-gray-800 rounded-xl p-8 shadow-2xl' style={{boxShadow: '0 0 40px rgba(56, 189, 248, 0.1), 0 20px 25px -5px rgba(0, 0, 0, 0.5)'}}>
                <div className='mb-8'>
                    <h2 className='text-2xl font-semibold text-white mb-2'>
                        Create Token
                    </h2>
                    <p className='text-sm text-gray-400'>Deploy your SPL token on Solana in seconds</p>
                </div>
            
            <div className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                        <label className='text-sm font-medium text-white'>Token Name</label>
                        <InputField value={formData.name} onChange={(val) => setFormData({...formData, name: val})} placeholder='e.g., My Token'></InputField>
                    </div>
                    <div className='space-y-2'>
                        <label className='text-sm font-medium text-white'>Symbol</label>
                        <InputField value={formData.symbol} onChange={(val) => setFormData({...formData, symbol: val})} placeholder='e.g., MTK'></InputField>
                    </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                        <label className='text-sm font-medium text-white'>Decimals</label>
                        <InputField value={formData.decimals} onChange={(val) => setFormData({...formData, decimals: val})} placeholder='e.g., 9'></InputField>
                    </div>
                    <div className='space-y-2'>
                        <label className='text-sm font-medium text-white'>Initial Supply</label>
                        <InputField value={formData.initialSupply} onChange={(val) => setFormData({...formData, initialSupply: val})} placeholder='e.g., 1000000'></InputField>
                    </div>
                </div>

                <div className='space-y-2'>
                    <label className='text-sm font-medium text-white'>Description</label>
                    <InputField value={formData.description} onChange={(val) => setFormData({...formData, description: val})} placeholder='Describe your token purpose and utility'></InputField>
                </div>

                <div className='space-y-2'>
                    <label className='text-sm font-medium text-white'>Image URL</label>
                    <InputField value={formData.imageUrl} onChange={(val) => setFormData({...formData, imageUrl: val})} placeholder='https://example.com/token-image.png'></InputField>
                </div>
            </div>

                <button 
                disabled={loading} 
                onClick={()=>{
                    if(!wallet.publicKey || !wallet.signTransaction){
                        return
                    }
                    createToken(
                        wallet.publicKey,
                        null,
                        parseInt(formData.decimals) || 0
                    )
                }} 
                className='group w-full mt-8 bg-white text-black px-4 py-3 rounded-lg font-medium hover:bg-gray-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white shadow-lg relative overflow-hidden'
                style={{boxShadow: '0 0 20px rgba(56, 189, 248, 0.2)'}}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.boxShadow = '0 0 30px rgba(56, 189, 248, 0.4), 0 0 60px rgba(56, 189, 248, 0.2)')}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 0 20px rgba(56, 189, 248, 0.2)')}
            >
                {loading ? "Creating Token..." : "Create Token"}
                </button>
                
                {success && (
                    <div className='mt-4 p-4 bg-gray-900 border border-cyan-500/30 rounded-lg text-white text-sm text-center' style={{boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)'}}>
                        ✓ Token created successfully
                    </div>
                )}
            </div>

            {/* Preview Section */}
            <div className='bg-[#0d0d0d] border border-gray-800 rounded-xl p-5 shadow-xl' style={{boxShadow: '0 0 30px rgba(56, 189, 248, 0.08)'}}>
                <div className='mb-4'>
                    <h3 className='text-sm font-semibold text-gray-400 mb-3'>PREVIEW</h3>
                </div>

                {/* Token Card Preview - Compact */}
                <div className='bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-cyan-500/30 transition-all duration-300'>
                    <div className='flex items-center gap-3'>
                        {/* Token Image */}
                        <div className='flex-shrink-0'>
                            <div className='w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-lg font-bold overflow-hidden'>
                                {formData.imageUrl ? (
                                    <img 
                                        src={formData.imageUrl} 
                                        alt={formData.name || 'Token'} 
                                        className='w-full h-full object-cover'
                                    />
                                ) : (
                                    formData.symbol ? formData.symbol.charAt(0).toUpperCase() : '?'
                                )}
                            </div>
                        </div>

                        {/* Token Info */}
                        <div className='flex-1 min-w-0'>
                            <h3 className='text-base font-semibold text-white truncate'>
                                {formData.name || 'Token Name'}
                            </h3>
                            <p className='text-xs text-gray-400'>
                                {formData.symbol || 'SYMBOL'}
                            </p>
                        </div>

                        {/* Token Stats - Inline */}
                        <div className='flex gap-3 text-right'>
                            <div>
                                <p className='text-xs text-gray-500'>Supply</p>
                                <p className='text-sm font-semibold text-white'>
                                    {formData.initialSupply ? parseInt(formData.initialSupply).toLocaleString() : '0'}
                                </p>
                            </div>
                            <div>
                                <p className='text-xs text-gray-500'>Decimals</p>
                                <p className='text-sm font-semibold text-white'>
                                    {formData.decimals || '0'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    </div>
}