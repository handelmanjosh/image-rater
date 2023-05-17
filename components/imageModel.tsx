
export type ImageModelProps = {
    src: string;
    redirect: string;
    percentage: number;
    number: number;
    loading?: boolean;
};

export default function ImageModel({ src, redirect, percentage, number, loading }: ImageModelProps) {
    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center w-[100px] h-[100px] border border-black rounded-md">
                <p>Loading...</p>
            </div>
        );
    } else {
        return (
            <a className="flex flex-col justify-center items-center w-[100px] h-[100px] border border-black rounded-md hover:scale-105 hover:cursor-pointer p-1" href={redirect}>
                <img src={src} className='w-full h-[70%]' alt="Game Image" />
                <p className="text-xs"> {`${number} Players`}</p>
                <StatusBar percentage={percentage} />
            </a>
        );
    }
}
function StatusBar({ percentage }: { percentage: number; }) {
    return (
        <div className={`w-full flex flex-row justify-start items-center h-[10%] border rounded-md ${percentage == 100 ? "border-green-600" : percentage < 50 ? "border-red-600" : "border-yellow-600"}`}>
            <div className={`h-full ${percentage == 100 ? "bg-green-600" : percentage < 50 ? "bg-red-600" : "bg-yellow-600"} `} style={{ width: `${percentage}%` }}>
            </div>
        </div>
    );
};;;