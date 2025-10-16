export default function ChatBox() {
    return (
        <div className="w-full pl-3 pr-1 py-1 rounded-3xl border border-gray-200 items-center gap-2 inline-flex justify-between">
            <div className="w-full flex items-center gap-2">
                <input class="w-full text-black text-xs font-medium leading-4 focus:outline-none" placeholder="Type here..."/>
            </div>
            <div class="flex items-center gap-2">
              <button class="items-center flex px-3 py-2 bg-indigo-600 rounded-full shadow ">
                <h3 class="text-white text-xs font-semibold leading-4 px-2">Send</h3>
              </button>
            </div>
        </div>
    );
}
