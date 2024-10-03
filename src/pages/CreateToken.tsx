export default function CreateToken(){
    return <div className="flex mt-[18vh] ">
    <div className="mx-auto justify-center">
      <div className="py-4">
        <input type="text" className="border border-black rounded-sm pr-14 pl-2 py-2 " placeholder="Name"/>
      </div>
      <div className="py-4">
        <input type="text" className="border border-black rounded-sm pr-14 pl-2 py-2 " placeholder="Symbol"/>
      </div>
      <div className="py-4">
        <input type="text" className="border border-black rounded-sm pr-14 pl-2 py-2 " placeholder="Initial Supply"/>
      </div>
      <div className="py-4">
        <input type="text" className="border border-black rounded-sm pr-14 pl-2 py-2 " placeholder="Token Image URL"/>
      </div>
      <button className="py-2 pr-14 pl-2 text-white bg-gray-800 border border-gray-800 hover:bg-white hover:text-black duration-200 rounded-sm mx-auto">Create a Token!</button>
    </div>
</div>
}