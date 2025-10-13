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
    
    return <div className='w-full max-w-2xl mx-auto'>
        <div className='border border-gray-800 rounded-lg p-8 bg-gray-950'>
            <div className='mb-8'>
                <h2 className='text-xl font-medium text-white mb-1'>
                    Create Token
                </h2>
                <p className='text-sm text-gray-500'>Fill in the details below to launch your token</p>
            </div>
            
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                <div>
                    <label className='text-xs text-gray-500 mb-1.5 block font-medium'>TOKEN NAME</label>
                    <InputField value={formData.name} onChange={(val) => setFormData({...formData, name: val})} placeholder='My Token'></InputField>
                </div>
                <div>
                    <label className='text-xs text-gray-500 mb-1.5 block font-medium'>SYMBOL</label>
                    <InputField value={formData.symbol} onChange={(val) => setFormData({...formData, symbol: val})} placeholder='MTK'></InputField>
                </div>
                <div>
                    <label className='text-xs text-gray-500 mb-1.5 block font-medium'>DECIMALS</label>
                    <InputField value={formData.decimals} onChange={(val) => setFormData({...formData, decimals: val})} placeholder='9'></InputField>
                </div>
                <div>
                    <label className='text-xs text-gray-500 mb-1.5 block font-medium'>INITIAL SUPPLY</label>
                    <InputField value={formData.initialSupply} onChange={(val) => setFormData({...formData, initialSupply: val})} placeholder='1000000'></InputField>
                </div>
            </div>

            <div className='space-y-4'>
                <div>
                    <label className='text-xs text-gray-500 mb-1.5 block font-medium'>DESCRIPTION</label>
                    <InputField value={formData.description} onChange={(val) => setFormData({...formData, description: val})} placeholder='Describe your token'></InputField>
                </div>
                <div>
                    <label className='text-xs text-gray-500 mb-1.5 block font-medium'>IMAGE URL</label>
                    <InputField value={formData.imageUrl} onChange={(val) => setFormData({...formData, imageUrl: val})} placeholder='https://example.com/image.png'></InputField>
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
                className='w-full mt-8 bg-white text-black px-4 py-3 rounded font-medium hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white'
            >
                {loading ? "Creating Token..." : "Create Token"}
            </button>
            
            {success && (
                <div className='mt-4 p-3 bg-gray-900 border border-gray-800 rounded text-gray-300 text-sm text-center'>
                    Token created successfully
                </div>
            )}
        </div>
    </div>
}