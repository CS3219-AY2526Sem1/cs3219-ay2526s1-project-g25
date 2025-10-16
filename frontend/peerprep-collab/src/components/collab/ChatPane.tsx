import ChatBox from "./ChatBox";
import ChatBubble from "./ChatBubble";

export default function ChatPane() {
    return (
        <div className="w-1/3 h-full bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col">
            <ul className="flex flex-wrap text-sm font-medium text-center text-gray-500 border-b border-gray-200">
                <li className="me-2">
                    <p className="inline-block p-4 text-blue-600 bg-gray-100 rounded-t-lg active"> Chat </p>
                </li>
                <li className="me-2">
                    <p className="inline-block p-4 rounded-t-lg hover:text-gray-600 hover:bg-gray-50"> AI Chat </p>
                </li>
            </ul>
            <div className="w-full h-max flex flex-col gap-2.5 pb-10 flex-1 overflow-y-auto">
                <ChatBubble isUser={false}>TEST MESSAGE</ChatBubble>
                <ChatBubble isUser={false}>TEST MESSAGE</ChatBubble>
                <ChatBubble isUser={true}>TEST MESSAGE</ChatBubble>
                <ChatBubble isUser={true}>TEST MESSAGE</ChatBubble>
                <ChatBubble isUser={false}>TEST MESSAGE</ChatBubble>
                <ChatBubble isUser={false}>TEST MESSAGE</ChatBubble>
                <ChatBubble isUser={false}>TEST MESSAGE</ChatBubble>
                <ChatBubble isUser={true}>TEST MESSAGE</ChatBubble>
                <ChatBubble isUser={true}>TEST MESSAGE</ChatBubble>
                <ChatBubble isUser={false}>TEST MESSAGE</ChatBubble>
                <ChatBubble isUser={false}>TEST MESSAGE</ChatBubble>
                <ChatBubble isUser={false}>TEST MESSAGE</ChatBubble>
                <ChatBubble isUser={true}>TEST MESSAGE</ChatBubble>
                <ChatBubble isUser={true}>TEST MESSAGE</ChatBubble>
                <ChatBubble isUser={false}>TEST MESSAGE</ChatBubble>
                <ChatBubble isUser={false}>TEST MESSAGE</ChatBubble>
                <ChatBubble isUser={false}>TEST MESSAGE</ChatBubble>
                <ChatBubble isUser={true}>TEST MESSAGE</ChatBubble>
                <ChatBubble isUser={true}>TEST MESSAGE</ChatBubble>
                <ChatBubble isUser={false}>TEST MESSAGE</ChatBubble>
            </div>
            <div className="mt-4 sticky bottom-0 bg-white pt-2 border-t border-gray-100">
                <ChatBox/>
            </div>
        </div>
    );
}
