export const InputField = ({placeholder}: {placeholder: string})=>{
    return <div>
        <input placeholder={placeholder} className="rounded-sm text-black my-3 py-1 px-3 bg-slate-600" type="text" />
    </div>
}