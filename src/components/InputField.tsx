export const InputField = ({placeholder, value, onChange}: 
    {
        placeholder: string,
        value: string | number,
        onChange: (value: string)=>void
    })=>{
    return <div>
        <input value={value} onChange={(e) => onChange(e.target.value) } placeholder={placeholder} className="rounded-sm text-black my-3 py-1 px-3 bg-slate-600" type="text" />
    </div>
}