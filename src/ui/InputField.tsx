import { Input } from "@/components/ui/input"

export const InputField = ({placeholder, value, onChange}: 
    {
        placeholder: string,
        value: string | number,
        onChange: (value: string)=>void
    })=>{
    return <div>
        <Input 
            value={value} 
            onChange={(e) => onChange(e.target.value)} 
            placeholder={placeholder} 
            type="text" 
        />
    </div>
}