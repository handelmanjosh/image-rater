import { getRecentImageNum } from "@/components/utils";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
let ran = 0;
let num = 0;
export default function Home() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [imageNum, setImageNum] = useState<number>(0);
  const router = useRouter();
  useEffect(() => {
    if (ran == 1) return;
    getRecentImageNum().then((response: number) => {
      setIsLoading(false);
      setImageNum(response);
      num = response;
    });
    ran++;
  }, []);
  const goToRecentImage = () => {
    router.push(`/images/image/${num}`, undefined, { shallow: false });
  };
  const goToRecentPage = () => {
    router.push(`/images/${num}`, undefined, { shallow: false });
  };
  if (isLoading) {
    return (
      <div className="flex flex-row justify-center items-center w-full">
        <p>Loading...</p>
      </div>
    );
  } else {
    return (
      <div className="flex flex-col justify-center items-center w-full gap-4">
        <a href={`/images/${0}`} className="text-blue-600 hover:underline active:text-purple-600">Rate some images</a>
        <div className="flex flex-row justify-center items-center gap-2">
          <button className="px-2 py-4 rounded-lg bg-blue-600 hover:brightness-95 active:brightness-75" onClick={goToRecentImage}>Go to recent Image</button>
          <button className="px-2 py-4 rounded-lg bg-blue-600 hover:brightness-95 active:brightness-75" onClick={goToRecentPage}>Go to recent Image page</button>
        </div>
        <div className="flex flex-row justify-center items-center gap-2">
          <p>{`Recent Image: ${imageNum}`}</p>
        </div>
      </div>
    );
  }
}