

import { useEffect, useState } from "react";
import ImageModel, { ImageModelProps } from "../../components/imageModel";
import { getAllBasicData } from "../../components/utils";
import { useRouter } from "next/router";

let imageGroupIndex: number = 0;
let ran = 0;
let imageModelPropsGlobal: ImageModelProps[] = [];
const ImagesHome = () => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [imgCount, setImgCount] = useState<number>(0);
    const [isError, setIsError] = useState<boolean>(false);
    const [imageModelProps, setImageModelProps] = useState<ImageModelProps[]>([]);
    const router = useRouter();
    useEffect(() => {
        if (router.isReady) {
            console.log("called");
            const { low } = router.query;
            console.log(low);
            imageGroupIndex = Number.isNaN(Number(low)) ? 0 : Number(low);
            console.log(imageGroupIndex);
            getAndSetData().then(() => setIsLoading(false));
        }
    }, [router.isReady]);
    const redirect = (num: number) => {
        window.location.href = `/images/${imageGroupIndex + num}`;
    };
    const getAndSetData = async () => {
        defaultImageModelProps();
        const getAllBasicDataGenerator = getAllBasicData(imageGroupIndex, imageGroupIndex + 50);
        for (let i = 0; i < 50; i++) {
            getAllBasicDataGenerator.next().then(result => {
                const tempData = result.value;
                if (tempData) {
                    setImgCount(tempData.count!);
                    const count: number = tempData.count!;
                    delete tempData.count;
                    addToImageModelProps(count, tempData);
                }
            });
        }
    };
    const addToImageModelProps = (index: number, data: ImageModelProps) => {
        imageModelPropsGlobal[index] = data;
        setImageModelProps(imageModelPropsGlobal);
    };
    const defaultImageModelProps = () => {
        const data: ImageModelProps[] = [];
        for (let i = 0; i < 50; i++) {
            data.push({ src: "", redirect: "/images", percentage: 0, number: 0, loading: true });
        }
        imageModelPropsGlobal = data;
        setImageModelProps(data);
    };
    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center w-full h-[100vh]">
                <p className="text-2xl">Loading...</p>
                <p>{`Images Loaded: ${imgCount}/50`}</p>
            </div>
        );
    } else if (isError) {
        return (
            <div className="flex flex-col justify-center items-center w-full h-[100vh]">
                {imageGroupIndex == 0 ?
                    <p className="text-2xl">{"No Images"}</p>
                    :
                    <>
                        <p className="text-2xl">{"No images on this page"}</p>
                        <Redirect click={() => redirect(-50)} text="Go Back" />
                    </>
                }
            </div>
        );
    } else {
        return (
            <div className="flex flex-col justify-between items-center w-full h-[100vh] p-4">
                <div className="grid grid-cols-10 grid-rows-5 place-items-center items-center gap-2">
                    {imageModelProps.map((props, i) => (
                        <ImageModel {...props} key={i} />
                    ))}
                </div>
                <div className="flex flex-row justify-center items-center">
                    <Redirect click={() => redirect(-50)} text="<" />
                    <Redirect click={() => redirect(50)} text=">" />
                </div>
            </div>
        );
    }
};
export default ImagesHome;

type RedirectProps = {
    click: () => any;
    text: string;
};
function Redirect({ click, text }: RedirectProps) {
    return (
        <button
            onClick={click}
            className="p-4 bg-blue-600 rounded-lg hover:brightness-90 active:brightness-75"
        >
            {text}
        </button>
    );
}