import { useState } from "react"
import {
  BotIcon,
  LoaderCircleIcon,
  MessageCircleIcon,
  SendIcon,
  SparklesIcon,
  UserIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { useChatMutation } from "@/hooks/queries/useChatMutation"
import { markdownComponents } from "@/lib/chatMarkdown"
import {
  createChatHistoryPayload,
  createAssistantMessage,
  createUserMessage,
  suggestedChatPrompts,
} from "@/lib/chatbot"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

function ChatBubble({ message }) {
  const isUser = message.role === "user"
  const Icon = isUser ? UserIcon : BotIcon

  return (
    <div
      className={cn(
        "flex gap-2",
        isUser ? "justify-end pl-8" : "justify-start pr-8",
      )}
    >
      {!isUser && (
        <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon />
        </span>
      )}
      <div
        className={cn(
          "max-w-full rounded-2xl px-3 py-2 text-sm leading-6 shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-card text-card-foreground ring-1 ring-border/80",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="break-words">
            <ReactMarkdown
              components={markdownComponents}
              remarkPlugins={[remarkGfm]}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyChatState({ onPickPrompt }) {
  return (
    <div className="flex min-h-72 flex-col justify-center gap-4 rounded-3xl border border-dashed bg-muted/30 p-4 text-center">
      <div className="mx-auto flex size-11 items-center justify-center rounded-3xl bg-primary/10 text-primary">
        <SparklesIcon />
      </div>
      <div>
        <p className="text-sm font-medium">Hỏi đáp với AI</p>
      </div>
      <div className="flex flex-col gap-2 text-left">
        Bắt đầu với
        {suggestedChatPrompts.map((prompt) => (
          <Button
            key={prompt}
            type="button"
            variant="outline"
            className="h-auto justify-start rounded-2xl px-3 py-2 text-left whitespace-normal"
            onClick={() => onPickPrompt(prompt)}
          >
            {prompt}
          </Button>
        ))}
      </div>
    </div>
  )
}

export function SqlChatbotSheet() {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([])
  const chatMutation = useChatMutation()

  async function submitMessage(event) {
    event?.preventDefault()

    const cleanMessage = message.trim()
    if (!cleanMessage || chatMutation.isPending) return

    const userMessage = createUserMessage(cleanMessage)
    const history = createChatHistoryPayload(messages)
    setMessages((current) => [...current, userMessage])
    setMessage("")

    try {
      const response = await chatMutation.mutateAsync({
        message: cleanMessage,
        history,
      })
      const assistantMessage = createAssistantMessage(response)
      setMessages((current) => [...current, assistantMessage])
    } catch (error) {
      toast.error("Chatbot phản hồi lỗi", {
        description:
          error.message ||
          "Không thể kết nối chatbot. Vui lòng kiểm tra cấu hình hệ thống.",
      })
      setMessages((current) => [
        ...current,
        createAssistantMessage({
          answer:
            error.message ||
            "Không thể kết nối chatbot. Vui lòng kiểm tra cấu hình hệ thống.",
        }),
      ])
    }
  }

  function pickPrompt(prompt) {
    setMessage(prompt)
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          type="button"
          size="icon-lg"
          className="fixed right-5 bottom-5 z-40 size-12 rounded-full shadow-lg shadow-primary/20"
          aria-label="Mở trợ lý tuyển dụng"
        >
          <MessageCircleIcon />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full p-0 data-[side=right]:sm:max-w-[46.8rem]">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="flex items-center gap-2">
            Trợ lý tuyển dụng
          </SheetTitle>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {messages.length === 0 ? (
              <EmptyChatState onPickPrompt={pickPrompt} />
            ) : (
              <div className="flex flex-col gap-4">
                {messages.map((item) => (
                  <ChatBubble key={item.id} message={item} />
                ))}
                {chatMutation.isPending && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <LoaderCircleIcon className="size-4 animate-spin" />
                    Đang suy nghĩ...
                  </div>
                )}
              </div>
            )}
          </div>

          <form
            className="border-t bg-background/95 p-4"
            onSubmit={submitMessage}
          >
            <div className="flex items-end gap-2">
              <Textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Ví dụ: Junior Backend ở Hà Nội lương khoảng bao nhiêu?"
                className="max-h-36 min-h-12 flex-1 rounded-3xl px-4 py-3"
                disabled={chatMutation.isPending}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    submitMessage(event)
                  }
                }}
              />
              <Button
                type="submit"
                size="icon-lg"
                className="mb-0 size-12 rounded-full"
                disabled={!message.trim() || chatMutation.isPending}
                aria-label="Gửi câu hỏi"
              >
                {chatMutation.isPending ? (
                  <LoaderCircleIcon className="animate-spin" />
                ) : (
                  <SendIcon />
                )}
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
