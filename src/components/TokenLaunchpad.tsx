import { useState } from "react"
import { InputField } from "../ui/InputField"
import { createInitializeMint2Instruction, getMinimumBalanceForRentExemptMint, MINT_SIZE, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { Keypair, PublicKey, SystemProgram, Transaction} from "@solana/web3.js"

export const TokenLaunchpad = ()=>{

    const [formData, setFormData] = useState<{ 
        name: string,
        symbol: string,
        initialSupply: number,
        imageUrl: string 
     }>({ 
        name: "",
        symbol: "",
        initialSupply: 0,
        imageUrl: ""
    })
    const {connection} = useConnection()
    const wallet = useWallet()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const createToken = async (
        payerPublicKey: PublicKey,
        mintAuthority: PublicKey,
        freezeAuthority: PublicKey | null,
        decimals: number,
        keypair = Keypair.generate(),
        programId = TOKEN_PROGRAM_ID,
    )=>{
        if(!wallet || wallet ===undefined){
            return
        }
        if(!wallet.signTransaction){
            alert("Your wallet doesn't allow to sign a transaction! Connect to a wallet which allows signing")
            return
        }

        setLoading(true)
        const lamports = await getMinimumBalanceForRentExemptMint(connection);

        try{
            const transaction = new Transaction().add(
                SystemProgram.createAccount({
                    fromPubkey: payerPublicKey,
                    newAccountPubkey: keypair.publicKey,
                    space: MINT_SIZE,
                    lamports,
                    programId,
                }),
                createInitializeMint2Instruction(keypair.publicKey, decimals, mintAuthority, freezeAuthority, programId),
            );

            transaction.partialSign(keypair)

            const signedTransaction = await wallet.signTransaction(transaction)
            const signature = await connection.sendRawTransaction(signedTransaction.serialize());
            await connection.confirmTransaction(signature)
            setSuccess(true)
            setTimeout(()=>{
                setSuccess(false)
            },2000)

        }catch(error){
            console.log(error)
        }finally{
            setLoading(false)
        }

    }
    
    

    return <div>
        <InputField value={formData.name} onChange={(val) => setFormData({...formData, name: val})} placeholder='Name of Token'></InputField>
        <InputField value={formData.symbol} onChange={(val) => setFormData({...formData, symbol: val})} placeholder='Symbol'></InputField>
        <InputField value={formData.initialSupply} onChange={(val) => setFormData({...formData, initialSupply: parseInt(val)})} placeholder='Initial Supply'></InputField>
        <InputField value={formData.imageUrl} onChange={(val) => setFormData({...formData, imageUrl: val})} placeholder='Image URL'></InputField>
        <button disabled = {loading} onClick={()=>{
        if(!wallet.publicKey || !wallet.signTransaction){
            return
        }
        createToken(
            wallet.publicKey,
            wallet.publicKey,
            wallet.publicKey,
            9
        )}} className='bg-gray-400 rounded-sm px-3 py-1 my-3 cursor-pointer hover:bg-gray-800 duration-200 hover:text-white'>Submit</button>
        {success && <span>Token Created Successfully!</span>}
            
    </div>
}