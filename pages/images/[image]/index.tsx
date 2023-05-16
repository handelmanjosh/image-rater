import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Player, { PlayerProps } from "@/components/Player";
import AWS, { S3 } from 'aws-sdk';
import { getDetailedData } from "@/components/utils";

AWS.config.update({
    accessKeyId: 'AKIAX3HTXUF4MRQPTLFT',
    secretAccessKey: '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',
    region: 'us-east-1',
});

let canvas: HTMLCanvasElement;
let context: CanvasRenderingContext2D;
let img: HTMLImageElement;
let currentArray: number[][] = [];
let selecting: boolean = false;
let arrays: number[][][] = [];
let playersGlobal: { position: string, team: string; responsibility: string; }[] = [];
let selectedPlayerGlobal: number = -1;
const defense: string[] = ["NT", "DT", "DE", "ILB", "OLB", "CB", "S"];
const offense: string[] = ["C", "OG", "OT", "TE", "QB", "RB", "FB", "WR"];
const responsibility: string[] = ["Shoot Group", "Control Group", "Man Coverage", "Zone Coverage", "Blitz"];
let imageIndex: number;
let ran = 0;
const url = "https://broncos-data-processing.s3.amazonaws.com/images/";
let isReady: boolean = false;
const SingleImage = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [players, setPlayers] = useState<{ position: string, team: string; responsibility: string; }[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<number>(-1);
    const [isError, setIsError] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const router = useRouter();
    useEffect(() => {
        canvas = document.getElementById("canvas") as HTMLCanvasElement;
        context = canvas.getContext("2d") as CanvasRenderingContext2D;
        const ratio = 2880 / 1800;
        canvas.width = 800;
        canvas.height = canvas.width / ratio;
        img = document.createElement("img");
        document.addEventListener("mousedown", handleMouseDown);
        document.addEventListener("touchstart", handleTouchStart);
        frame();
        ran++;
    }, []);
    useEffect(() => {
        if (router.isReady) {
            const { image } = router.query;
            imageIndex = Number(image);
            img.src = `${url}${image}.png`;
            isReady = true;
            console.log(img.src);
            fetchStartingData(imageIndex).then(() => console.log("done"));
        }
    }, [router.isReady]);
    const fetchStartingData = async (num: number) => {
        const data = await getDetailedData(num);
        console.log(data.data);
        if (data) {
            const playersArray: { position: string, team: string; responsibility: string; }[] = [];
            const locationArray: number[][][] = [];
            for (const item of data.data) {
                playersArray.push({ position: item.position, team: item.team, responsibility: "UNDEFINED" });
                locationArray.push(to2dArray(item.location));
            }
            playersGlobal = playersArray;
            arrays = locationArray;
            setPlayers(playersGlobal);
        }
    };
    const to2dArray = (items: any): number[][] => {
        const result: number[][] = [];
        const values = items.split(",");
        for (let i = 0; i < values.length; i += 2) {
            result.push([Number(values[i]), Number(values[i + 1])]);
        }
        return result;
    };
    const adjustToCanvas = (x: number, y: number): number[] => {
        const canvasRect = canvas.getBoundingClientRect();
        return [x - canvasRect.left - window.scrollX, y - canvasRect.top - window.scrollY];
    };
    const handleTouchStart = () => {
        selecting = true;
        document.addEventListener("touchmove", touch);
        const remove = () => {
            if (currentArray.length != 0) {
                if (selectedPlayerGlobal == -1) {
                    arrays.push(currentArray);
                    playersGlobal.push({ position: "UNDEFINED", team: "UNDEFINED", responsibility: "UNDEFINED" });
                    const newPlayers = [...playersGlobal];
                    setPlayers(newPlayers);
                } else {
                    for (let item of currentArray) {
                        if (!includes(arrays[selectedPlayerGlobal], item)) {
                            arrays[selectedPlayerGlobal].push(item);
                        }
                    }
                }
                currentArray = [];
            }
            selecting = false;
            document.removeEventListener("touchmove", touch);
            document.removeEventListener("touchend", remove);
        };
        document.addEventListener("touchend", remove);
    };
    const touch = (event: TouchEvent) => {
        const [x, y] = adjustToCanvas(event.touches[0].clientX, event.touches[0].clientY);
        onSelect(x, y);
    };
    const mouse = (event: MouseEvent) => {
        const [x, y] = adjustToCanvas(event.clientX, event.clientY);
        onSelect(x, y);
    };
    const handleMouseDown = () => {
        selecting = true;
        document.addEventListener("mousemove", mouse);
        const remove = () => {
            if (currentArray.length != 0) {
                if (selectedPlayerGlobal == -1) {
                    arrays.push(currentArray);
                    playersGlobal.push({ position: "UNDEFINED", team: "UNDEFINED", responsibility: "UNDEFINED" });
                    const newPlayers = [...playersGlobal];
                    setPlayers(newPlayers);
                } else {
                    for (let item of currentArray) {
                        if (!includes(arrays[selectedPlayerGlobal], item)) {
                            arrays[selectedPlayerGlobal].push(item);
                        }
                    }
                }
                currentArray = [];
            }
            selecting = false;
            document.removeEventListener("mousemove", mouse);
            document.removeEventListener("mouseup", remove);
        };
        document.addEventListener("mouseup", remove);
    };
    const onSelect = (x: number, y: number) => {
        if (x < 0 || y < 0 || y > canvas.height || x > canvas.width) {
            return;
        }
        for (let i = 0; i < 8; i++) {
            for (let ii = 0; ii < 8; ii++) {
                const next = [Math.floor(x + i), Math.floor(y + ii)];
                if (!includes(currentArray, next)) {
                    currentArray.push(next);
                }
                context.fillStyle = "red";
                context.fillRect(x + i, y + ii, 1, 1);
            }
        }
    };
    const frame = () => {
        if (!selecting) {
            resetCanvas();
            let index = 0;
            for (const array of arrays) {
                for (const item of array) {
                    const x = item[0];
                    const y = item[1];
                    context.fillStyle = selectedPlayerGlobal == index ? "yellow" : "red";
                    context.fillRect(x, y, 1, 1);
                }
                index++;
            }
        }
        requestAnimationFrame(frame);
    };
    const deletePlayer = (index: number) => {
        console.log(arrays, playersGlobal);
        arrays.splice(index, 1);
        playersGlobal.splice(index, 1);
        console.log(arrays, playersGlobal);

        const newPlayers = [...playersGlobal];

        setPlayers(newPlayers);
        setSelectedPlayer(-1);
        selectedPlayerGlobal = -1;
    };
    const resetCanvas = () => {
        if (img && isReady) {
            try {
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.drawImage(img, 0, 0, canvas.width, canvas.height);
            } catch (e) {
                setIsError(true);
            }
        }
    };
    const downloadData = async () => {
        setSaving(true);
        const s3 = new S3();
        let data = ``;
        for (let i = 0; i < arrays.length; i++) {
            const temp = `Player Location:${arrays[i]}\nPlayer Position:${playersGlobal[i].position}\nPlayer Team:${playersGlobal[i].team}\n`;
            data += temp;
        }
        console.log({ imageIndex });
        const params = {
            Bucket: "broncos-data-processing",
            Key: `results/${imageIndex}.txt`,
            Body: data,
        };
        await s3.upload(params).promise();
        // img.src = `${url}${imageIndex}.png`;
        // arrays = [];
        // playersGlobal = [];
        // setPlayers(playersGlobal);
        console.log("data saved");
        const a = document.createElement("a");
        a.href = `/images/${imageIndex + 1}`;
        a.click();
    };
    const includes = (array: number[][], item: number[]) => {
        for (const thing of array) {
            if (item[0] == thing[0] && item[1] == thing[1]) {
                return true;
            }
        }
        return false;
    };
    const back = () => {
        const { image } = router.query;
        let num = Number(image);
        const a = document.createElement("a");
        a.href = `/images/${num - 1}`;
        a.click();
    };
    const next = () => {
        const { image } = router.query;
        let num = Number(image);
        const a = document.createElement("a");
        a.href = `/images/${num + 1}`;
        a.click();
    };
    const home = () => {
        const a = document.createElement("a");
        a.href = "/images";
        a.click();
    };
    if (isLoading) {
        return (
            <div className="flex flex-row justify-center items-center w-full">
                <p>{"Loading"}</p>
            </div>
        );
    } else if (isError) {
        return (
            <div className="flex flex-row justify-center items-center w-full gap-4 h-[100vh]">
                <p>{"Image not found"}</p>
                <button onClick={home} className="bg-blue-600 p-4 hover:brightness-90 active:brightness-75">Home</button>
            </div>
        );
    } else if (saving) {
        return (
            <div className="flex flex-row justify-center items-center w-full">
                {"Saving"}
            </div>
        );
    } else {
        return (
            <div className="flex flex-col justify-center items-center w-full">
                <div className="flex flex-row justify-center gap-4 items-center">
                    <div className="flex flex-col justify-center items-center h-[70vh] gap-2">
                        <canvas id="canvas" className="border-2 border-black" />
                        <div className="flex flex-col justify-center items-center gap-2">
                            <button onClick={downloadData} className="p-4 rounded-lg bg-blue-600 hover:brightness-90 active:brightness-75">Save Data</button>
                            <div className="flex flex-row justify-center items-center gap-2">
                                <button onClick={back} className="p-4 rounded-lg bg-blue-600 hover:brightness-90 active:brightness-75">Back</button>
                                <button onClick={next} className="p-4 rounded-lg bg-blue-600 hover:brightness-90 active:brightness-75">Next</button>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-5 grid-rows-4 gap-2">
                        {players.map((player, index) => {
                            if (index == selectedPlayer) {
                                return (
                                    <Player
                                        {...player}
                                        key={index}
                                        select={() => { setSelectedPlayer(index); selectedPlayerGlobal = index; }}
                                        remove={() => deletePlayer(index)}
                                        unselect={() => { setSelectedPlayer(-1); selectedPlayerGlobal = -1; }}
                                        selected={true}
                                    />
                                );
                            } else {
                                return (
                                    <Player
                                        {...player}
                                        key={index}
                                        select={() => { setSelectedPlayer(index); selectedPlayerGlobal = index; }}
                                        remove={() => deletePlayer(index)}
                                        unselect={() => { setSelectedPlayer(-1); selectedPlayerGlobal = -1; }}
                                        selected={false}
                                    />
                                );
                            }
                        })}
                    </div>
                </div>
                {selectedPlayer !== -1 ?
                    <div className="flex flex-col justify-center items-center gap-2">
                        <div className="flex flex-row justify-center gap-2 items-center">
                            {defense.map((position, i) => (
                                <button
                                    key={i}
                                    className="bg-red-600 p-4 hover:brightness-90 active:brightness-75 rounded-lg border-2 border-black"
                                    onClick={() => {
                                        const newPlayers = [...players];
                                        newPlayers[selectedPlayer].position = position;
                                        newPlayers[selectedPlayer].team = "defense";
                                        setPlayers(newPlayers);
                                    }}
                                >
                                    {position}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-row justify-center gap-2 items-center">
                            {offense.map((position, i) => (
                                <button
                                    key={i}
                                    className="bg-green-600 p-4 hover:brightness-90 active:brightness-75 rounded-lg border-2 border-black"
                                    onClick={() => {
                                        const newPlayers = [...players];
                                        newPlayers[selectedPlayer].position = position;
                                        newPlayers[selectedPlayer].team = "offense";
                                        setPlayers(newPlayers);
                                    }}
                                >
                                    {position}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-row justify-center items-center gap-2">
                            {responsibility.map((r, i) => (
                                <button
                                    key={i}
                                    className="bg-orange-600 p-4 hover:brightness-90 active:brightness-75 rounded-lg border-2 border-black"
                                    onClick={() => {
                                        const newPlayers = [...players];
                                        newPlayers[selectedPlayer].responsibility = r;
                                        setPlayers(newPlayers);
                                    }}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div> : <></>
                }
            </div>
        );
    }
};

export default SingleImage;

type StateButtonProps = {
    click: () => any;
    text: string;
};
function StateButton({ click, text }: StateButtonProps) {
    const [loading, setLoading] = useState<boolean>(false);
    const onClick = () => {
        setLoading(true);
        click().then(() => setLoading(false));
    };
    return (
        <button
            onClick={onClick}
            className="p-4 rounded-lg bg-blue-600 hover:brightness-90 active:brightness-75"
        >
            {loading ? "Loading..." : `${text}`}
        </button>
    );
}