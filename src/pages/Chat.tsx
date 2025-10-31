import { Layout } from "@/components/Layout";
import { ChatInterface } from "@/components/ChatInterface";

export default function Chat() {
  return (
    <Layout showNav={true}>
      <div className="flex flex-col h-[calc(100vh-4rem)] min-h-[calc(100vh-4rem)]">
        {/* Chat Interface */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface />
        </div>
      </div>
    </Layout>
  );
}
