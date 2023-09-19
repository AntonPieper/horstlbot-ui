import { For, Show, createSignal } from "solid-js";
import mic from "./mic.svg";
import horstl from "./horstl.png";
enum MessageType {
  User = "Du",
  Bot = "HorstlBot",
}
enum MicStatus {
  Inactive = "inactive",
  Active = "active",
  Loading = "loading",
}
type Message = {
  type: MessageType;
  text: string | null;
  image: string | null;
  link: string | null;
};
type ResponseItem = {
  recipient_id: string;
  image?: string;
  text?: string;
  custom?: { link?: string };
};
function Messages(props: { messages: Message[] }) {
  return (
    <div>
      <For each={props.messages}>
        {(message) => (
          <div
            class={`flex p-1 gap-2 border-b border-b-gray-200 ${
              message.type === MessageType.Bot ? "bg-gray-100" : ""
            }`}
          >
            <strong class="w-24 flex-shrink-0">{message.type}: </strong>
            <Show when={message.image}>
              <div class="col-span-4 w-full max-w-full rounded-lg overflow-hidden">
                <img src={message.image!} />
              </div>
            </Show>
            <span class="col-span-4">{message.text}</span>
            <Show when={message.link}>
              <a
                href={message.link!}
                target="_blank"
                class="col-span-4 text-blue-500 hover:underline"
              >
                {message.link}
              </a>
            </Show>
          </div>
        )}
      </For>
    </div>
  );
}
function Chatbot() {
  const [messages, setMessages] = createSignal<Message[]>([]);
  const [input, setInput] = createSignal("");
  const [micStatus, setMicStatus] = createSignal(MicStatus.Inactive);
  const [url, setUrl] = createSignal(
    "http://localhost:5005/webhooks/rest/webhook"
  );
  const [name, setName] = createSignal("Test User");
  let ref: HTMLFormElement;

  const sendMessage = async (event: Event) => {
    event.preventDefault();
    setMessages((messages) => [
      ...messages,
      { type: MessageType.User, text: input(), image: null, link: null },
    ]);
    const headers = new Headers();
    headers.append("Content-Type", "application/json");

    const body = JSON.stringify({
      sender: name(),
      message: input(),
    });

    const requestOptions: RequestInit = {
      method: "POST",
      headers,
      body,
    };
    const response = await fetch(url(), requestOptions);
    const data: ResponseItem[] = await response.json();
    console.log(data);
    const answers: Message[] = data.map(
      ({ image = null, text = null, custom = { link: null } }) => ({
        type: MessageType.Bot,
        text,
        image,
        link: custom.link ?? null,
      })
    );
    setMessages((messages) => [...messages, ...answers]);
    setInput("");
  };
  const handleMicClick = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "de-DE";
    recognition.start();
    setMicStatus(MicStatus.Loading);
    recognition.onstart = () => {
      setMicStatus(MicStatus.Active);
    };
    recognition.onend = () => {
      setMicStatus(MicStatus.Inactive);
    };
    recognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript;
      setInput(result);
      setMicStatus(MicStatus.Inactive);
    };
  };
  return (
    <main class="w-screen m-0 p-0 mb-32">
      <nav class="flex justify-between w-full border-b-2 border-gray-200 p-2 sticky top-0">
        <h1 class="flex items-center">
          <img src={horstl} alt="Horstl" />
          <span class="text-5xl font-bold">Bot</span>
        </h1>
        <div class="flex items-center justify-center gap-2">
          <label for="url" class="font-bold">
            Name:
          </label>
          <input
            class="w-24"
            type="text"
            name="name"
            id="name"
            onInput={(e) => setName(e.target.value)}
            value={name()}
          />
          <label for="url" class="font-bold">
            API:
          </label>
          <input
            class="w-96"
            type="text"
            name="url"
            id="url"
            onInput={(e) => setUrl(e.target.value)}
            value={url()}
          />
        </div>
      </nav>
      <Messages messages={messages()} />
      <form onSubmit={sendMessage} class="fixed bottom-0 w-full" ref={ref!}>
        <div class="flex gap-2 m-2 items-center bg-white pt-2">
          <button
            type="button"
            onClick={handleMicClick}
            class={`p-4 rounded-2xl ${
              micStatus() === MicStatus.Inactive ? "bg-blue-300" : ""
            } ${micStatus() === MicStatus.Loading ? "bg-gray-400" : ""} ${
              micStatus() === MicStatus.Active ? "bg-green-500" : ""
            }}`}
          >
            <img src={mic} class="w-6 h-6" />
          </button>
          <textarea
            class="flex-1 resize-none border-gray-200 placeholder:text-gray-400 border-2 rounded-lg p-2"
            placeholder="Sende eine Nachricht"
            value={input()}
            onKeyDown={(e) => {
              if (
                input().length > 0 &&
                ((e.key === "Enter" && e.metaKey) ||
                  (e.key === "Enter" && e.ctrlKey))
              ) {
                ref.dispatchEvent(new Event("submit"));
              }
            }}
            onInput={(e) => {
              setInput(e.target.value);
            }}
          />
          <button
            disabled={input().length === 0}
            class="flex-0 px-4 py-2 bg-blue-500 text-white rounded-full disabled:bg-gray-300"
          >
            Send
          </button>
        </div>
      </form>
    </main>
  );
}

export default Chatbot;
