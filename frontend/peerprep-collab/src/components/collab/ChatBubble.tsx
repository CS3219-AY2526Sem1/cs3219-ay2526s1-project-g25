export default function ChatBubble({isUser, children}) {
    const bubble_justify = isUser ? "justify-end" : "justify-start";
    const bubble_color = isUser ? "bg-indigo-600" : "bg-gray-100";
    const text_color = isUser ? "text-white" : "text-gray-900";

    return (
        <div className={`w-full flex ${bubble_justify}`}>
            <div className={`px-3.5 py-2 ${bubble_color} rounded justify-start items-center gap-3 inline-flex`}>
                <p className={`${text_color} text-sm font-normal`}>{children}</p>
            </div>
        </div>
    )
}
