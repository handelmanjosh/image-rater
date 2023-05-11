import Player, { PlayerProps } from "@/components/Player";
import { useEffect, useState } from "react";
import { saveAs } from 'file-saver';

let canvas: HTMLCanvasElement;
let context: CanvasRenderingContext2D;
let img: HTMLImageElement;
type Colors = "red" | "green";
let currentArray: number[][] = [];
let selecting: boolean = false;
const arrays: number[][][] = [];
const playersGlobal: { position: string, team: string; }[] = [];
let selectedPlayerGlobal: number = -1;
const defense: string[] = ["NT", "DT", "DE", "ILB", "OLB", "CB", "S"];
const offense: string[] = ["C", "OG", "OT", "TE", "QB", "RB", "FB", "WR"];
export default function Home() {
  const [players, setPlayers] = useState<{ position: string, team: string; }[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<number>(-1);

  useEffect(() => {
    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    context = canvas.getContext("2d") as CanvasRenderingContext2D;
    canvas.width = 811;
    canvas.height = 455;
    img = document.createElement("img");
    img.src = "/test.jpg";
    document.addEventListener("mousedown", handleMouseDown);
    frame();
  }, []);
  const adjustToCanvas = (x: number, y: number): number[] => {
    const canvasRect = canvas.getBoundingClientRect();
    return [x - canvasRect.left - window.scrollX, y - canvasRect.top - window.scrollY];
  };
  const handleMouseDown = () => {
    selecting = true;
    document.addEventListener("mousemove", onSelect);
    const remove = () => {
      if (currentArray.length != 0) {
        if (selectedPlayerGlobal == -1) {
          arrays.push(currentArray);
          playersGlobal.push({ position: "UNDEFINED", team: "UNDEFINED" });
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
        console.log(arrays);
        console.log(playersGlobal);
      }
      selecting = false;
      document.removeEventListener("mousemove", onSelect);
      document.removeEventListener("mouseup", remove);
    };
    document.addEventListener("mouseup", remove);
  };
  const onSelect = (event: MouseEvent) => {
    const [x, y] = adjustToCanvas(event.clientX, event.clientY);
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
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
  const downloadData = () => {
    let data = ``;
    for (let i = 0; i < arrays.length; i++) {
      const temp = `Player Location: ${arrays[i]}\n Player Position: ${playersGlobal[i].position}\n Player Team: ${playersGlobal[i].team}\n`;
      data += temp;
    }
    const blob = new Blob([data], { type: "text/plain;charset=utf-8" });
    console.log(blob.size);
    saveAs(blob, 'result.txt');
  };
  const includes = (array: number[][], item: number[]) => {
    for (const thing of array) {
      if (item[0] == thing[0] && item[1] == thing[1]) {
        return true;
      }
    }
    return false;
  };
  return (
    <div className="flex flex-col justify-center items-center w-full">
      <div className="flex flex-row justify-center gap-4 items-center">
        <div className="flex flex-col justify-center items-center h-[70vh]">
          <canvas id="canvas" className="border-2 border-black" />
          <button onClick={downloadData} className="p-4 rounded-lg bg-blue-600">Download Data</button>
        </div>
        <div className="flex flex-col justify-center gap-2 items-center">
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
        </div> : <></>}
    </div>
  );
}



