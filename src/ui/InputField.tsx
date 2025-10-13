export const InputField = ({placeholder, value, onChange}: 
    {
        placeholder: string,
        value: string | number,
        onChange: (value: string)=>void
    })=>{
    return <div>
        <input 
            value={value} 
            onChange={(e) => onChange(e.target.value)} 
            placeholder={placeholder} 
            className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-700 transition-colors" 
            type="text" 
        />
    </div>
}