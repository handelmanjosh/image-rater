

export type PlayerProps = {
    position: string;
    team: string;
    responsibility: string;
    select: () => any;
    unselect: () => any;
    remove: () => any;
    selected: boolean;
};
export default function Player({ position, team, selected, responsibility, remove, select, unselect }: PlayerProps) {

    return (
        <div className={`flex flex-col justify-center gap-2 items-center border-2 border-black rounded-lg p-2 ${position == "UNDEFINED" || team == "UNDEFINED" ? "bg-red-600" : ""} ${selected ? "bg-yellow-400" : ""}`}>
            <div className="flex flex-col justify-center items-center gap-1">
                <p className="text-xs">Position: {position}</p>
                <p className="text-xs">Team: {team}</p>
                <p className="text-xs">Responsibility: {responsibility}</p>
            </div>
            <div className="flex flex-col justify-center items-center gap-1">
                <button onClick={selected ? unselect : select} className="bg-yellow-600 border border-black hover:brightness-90 active:brightness-75 py-1 px-2 rounded-md"> {selected ? "Unselect" : "Select"} </button>
                <button onClick={remove} className="bg-red-600 border border-black hover:brightness-90 active:brightness-75 py-1 px-2 rounded-md"> Delete </button>
            </div>
        </div>
    );

}