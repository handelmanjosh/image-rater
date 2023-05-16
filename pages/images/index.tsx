

import { useEffect, useState } from "react";
import ImageModel, { ImageModelProps } from "../../components/imageModel";
import { getAllBasicData } from "../../components/utils";

let imageGroupIndex: number = 0;
const ImagesHome = () => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isError, setIsError] = useState<boolean>(false);
    const [imageModelProps, setImageModelProps] = useState<ImageModelProps[]>([]);
    useEffect(() => {

        getAndSetData().then(() => setIsLoading(false));
    }, []);
    const redirect = (num: number) => {
        imageGroupIndex += num;
        if (imageGroupIndex < 0) {
            imageGroupIndex = 0;
        }
        setIsLoading(true);
        getAndSetData().then(() => setIsLoading(false));
    };
    const getAndSetData = async () => {
        const data = await getAllBasicData(imageGroupIndex, imageGroupIndex + 50);
        if (data.length == 0) {
            setIsError(true);
        } else {
            setIsError(false);
        }
        console.log(data);
        setImageModelProps(data);
        console.log(data);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center w-full h-[100vh]">
                <p className="text-2xl">Loading...</p>
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