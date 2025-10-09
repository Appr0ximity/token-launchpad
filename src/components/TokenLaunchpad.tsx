import { useState } from "react"
import { InputField } from "../ui/InputField"
import { createInitializeMetadataPointerInstruction, createInitializeMint2Instruction, ExtensionType, getMintLen, LENGTH_SIZE, TOKEN_2022_PROGRAM_ID, TYPE_SIZE } from "@solana/spl-token"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { Keypair, PublicKey, SystemProgram, Transaction} from "@solana/web3.js"
import { createInitializeInstruction, createUpdateFieldInstruction, pack, type TokenMetadata } from "@solana/spl-token-metadata"

export const TokenLaunchpad = ()=>{

    const [formData, setFormData] = useState<{ 
        name: string,
        symbol: string,
        initialSupply: number,
        imageUrl: string,
        description: string
     }>({ 
        name: "",
        symbol: "",
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
        mint = Keypair.generate(),
        programId = TOKEN_2022_PROGRAM_ID,
    )=>{
        if(!wallet || wallet ===undefined || !wallet.publicKey){
            return
        }
        if(!wallet.signTransaction){
            alert("Your wallet doesn't allow to sign a transaction! Connect to a wallet which allows signing")
            return
        }

        const metaData: TokenMetadata = {
            updateAuthority: wallet.publicKey,
            mint: mint.publicKey,
            name: formData.name,
            symbol: formData.symbol,
            uri: formData.imageUrl,
            additionalMetadata: [["description", formData.description]]
        }
        const metadataExtension = TYPE_SIZE + LENGTH_SIZE
        const metadataLen = pack(metaData).length
        const mintLen = getMintLen([ExtensionType.MetadataPointer])
        const lamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataExtension + metadataLen)

        setLoading(true)

        try{
            const initializeMetadataPointerInstruction = createInitializeMetadataPointerInstruction(
                mint.publicKey,
                wallet.publicKey,
                mint.publicKey,
                TOKEN_2022_PROGRAM_ID
            );

            const initializeMintInstruction = createInitializeMint2Instruction(
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
            );

            const {blockhash} = await connection.getLatestBlockhash()
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = wallet.publicKey
            transaction.partialSign(mint)

            const signedTransaction = await wallet.signTransaction(transaction)
            const signature = await connection.sendRawTransaction(signedTransaction.serialize())
            await connection.confirmTransaction(signature)

            const metadataTransaction = new Transaction().add(
                initializeMetadataInstruction,
                updateFieldInstruction
            );

            const {blockhash: blockhash2} = await connection.getLatestBlockhash()
            metadataTransaction.recentBlockhash = blockhash2
            metadataTransaction.feePayer = wallet.publicKey

            const signedMetadataTransaction = await wallet.signTransaction(metadataTransaction)
            const metadataSignature = await connection.sendRawTransaction(signedMetadataTransaction.serialize())
            await connection.confirmTransaction(metadataSignature)

            console.log('mintLen:', mintLen);
            console.log('metadataLen:', metadataLen);
            console.log('total space:', mintLen + metadataExtension + metadataLen);

            alert(`Token created! Mint address: ${mint.publicKey.toBase58()}`);
            setSuccess(true)
            setTimeout(()=>{
                setSuccess(false)
            },2000)

        }catch(error){
            alert(`Failed to create token: ${error || 'Unknown error'}`);
            console.log(error)
        }finally{
            setLoading(false)
        }

    }
    
    

    return <div>
        <InputField value={formData.name} onChange={(val) => setFormData({...formData, name: val})} placeholder='Name of Token'></InputField>
        <InputField value={formData.symbol} onChange={(val) => setFormData({...formData, symbol: val})} placeholder='Symbol'></InputField>
        <InputField value={formData.initialSupply} onChange={(val) => setFormData({...formData, initialSupply: parseInt(val)})} placeholder='Initial Supply'></InputField>
        <InputField value={formData.description} onChange={(val) => setFormData({...formData, description: val})} placeholder='Description'></InputField>
        <InputField value={formData.imageUrl} onChange={(val) => setFormData({...formData, imageUrl: val})} placeholder='Image URL'></InputField>
        <button disabled = {loading} onClick={()=>{
        if(!wallet.publicKey || !wallet.signTransaction){
            return
        }
        createToken(
            wallet.publicKey,
            null,
            9
        )}} className='bg-gray-400 rounded-sm px-3 py-1 my-3 cursor-pointer hover:bg-gray-800 duration-200 hover:text-white'>{loading?"Creating a token..":"Submit"}</button>
        {success && <span>Token Created Successfully!</span>}
            
    </div>
}