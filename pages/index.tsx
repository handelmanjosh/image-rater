import Player, { PlayerProps } from "@/components/Player";
import { useEffect, useState } from "react";
import { saveAs } from 'file-saver';
import AWS, { S3 } from 'aws-sdk';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';



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
export default function Home() {
  const [players, setPlayers] = useState<{ position: string, team: string; responsibility: string; }[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<number>(-1);
  useEffect(() => {
    if (ran == 1) return;
    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    context = canvas.getContext("2d") as CanvasRenderingContext2D;
    const ratio = 2880 / 1800;
    canvas.width = 800;
    canvas.height = canvas.width / ratio;
    getStartingImage().then(number => {
      imageIndex = number;
      img = document.createElement("img");
      img.src = `/data/${imageIndex}.png`;
      console.log(imageIndex);
    });
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("touchstart", handleTouchStart);
    frame();
    ran++;
  }, []);
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
    if (img) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
  };
  const downloadData = async () => {
    console.log(process.env.AWS_ACCESS_KEY_ID, process.env.AWS_SECRET_ACCESS_KEY);
    const s3 = new S3();
    let data = ``;
    for (let i = 0; i < arrays.length; i++) {
      const temp = `Player Location: ${arrays[i]}\n Player Position: ${playersGlobal[i].position}\n Player Team: ${playersGlobal[i].team}\n`;
      data += temp;
    }
    const params = {
      Bucket: "broncos-data-processing",
      Key: `results/${imageIndex}.txt`,
      Body: data,
    };
    await s3.upload(params).promise();
    imageIndex++;
    await updateStartingImage(imageIndex);
    img.src = `/data/${imageIndex}.png`;
    arrays = [];
    playersGlobal = [];
    setPlayers(playersGlobal);
  };
  const includes = (array: number[][], item: number[]) => {
    for (const thing of array) {
      if (item[0] == thing[0] && item[1] == thing[1]) {
        return true;
      }
    }
    return false;
  };
  const getStartingImage = async () => {
    const s3 = new S3();
    const params = {
      Bucket: "broncos-data-processing",
      Key: "currentProcessingImageNum.txt",
    };
    const response = await s3.getObject(params).promise();
    const number = Number(response.Body?.toString('utf-8'));
    console.log('Starting image index:', number);
    return number;
  };
  const updateStartingImage = async (num: number) => {
    const s3 = new S3();
    const params = {
      Bucket: "broncos-data-processing",
      Key: "currentProcessingImageNum.txt",
      Body: `${num}`
    };
    await s3.upload(params).promise();
  };
  return (
    <div className="flex flex-col justify-center items-center w-full">
      <div className="flex flex-row justify-center gap-4 items-center">
        <div className="flex flex-col justify-center items-center h-[70vh]">
          <canvas id="canvas" className="border-2 border-black" />
          <button onClick={downloadData} className="p-4 rounded-lg bg-blue-600">Download Data</button>
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



