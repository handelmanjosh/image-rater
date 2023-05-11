import ChatBox from '@/components/ChatBox';
import '@/styles/globals.css';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChatBox>
      <main className="flex flex-col justify-start p-8 items-center w-full h-[100vh]">
        <Component {...pageProps} />
      </main>
    </ChatBox>
  );
}
