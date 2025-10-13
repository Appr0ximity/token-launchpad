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
        decimals: number,
        initialSupply: number,
        imageUrl: string,
        description: string
     }>({ 
        name: "",
        symbol: "",
        decimals: 0,
        initialSupply: 0,
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

            // If user wants initial supply, mint it
            if (formData.initialSupply && formData.initialSupply > 0) {
                // Create ATA transaction
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
                
                // Mint tokens
                const mintAmount = formData.initialSupply * Math.pow(10, decimals);
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
    
    return <div>
        <InputField value={formData.name} onChange={(val) => setFormData({...formData, name: val})} placeholder='Name of Token'></InputField>
        <InputField value={formData.symbol} onChange={(val) => setFormData({...formData, symbol: val})} placeholder='Symbol'></InputField>
        <InputField value={formData.decimals} onChange={(val) => setFormData({...formData, decimals: parseInt(val)})} placeholder='Decimals'></InputField>
        <InputField value={formData.initialSupply} onChange={(val) => setFormData({...formData, initialSupply: parseInt(val)})} placeholder='Decimals'></InputField>
        <InputField value={formData.description} onChange={(val) => setFormData({...formData, description: val})} placeholder='Description'></InputField>
        <InputField value={formData.imageUrl} onChange={(val) => setFormData({...formData, imageUrl: val})} placeholder='Image URL'></InputField>
        <button disabled = {loading} onClick={()=>{
        if(!wallet.publicKey || !wallet.signTransaction){
            return
        }
        createToken(
            wallet.publicKey,
            null,
            formData.decimals
        )}} className='bg-gray-400 rounded-sm px-3 py-1 my-3 cursor-pointer hover:bg-gray-800 duration-200 hover:text-white'>{loading?"Creating a token..":"Submit"}</button>
        {success && <span>Token Created Successfully!</span>}
    </div>
}