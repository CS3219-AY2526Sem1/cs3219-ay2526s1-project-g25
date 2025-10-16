import ChatBox from "./ChatBox";
import ChatBubble from "./ChatBubble";

export default function ChatPane() {
    return (
        <div className="w-1/3 h-full bg-white border border-gray-200 rounded-2xl p-6 shadow-sm overflow-y-scroll">
            <div className="w-full h-max flex flex-col gap-2.5 pb-10">
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
            <div className="w-full">
                <ChatBox/>
            </div>
        </div>
    );
}
