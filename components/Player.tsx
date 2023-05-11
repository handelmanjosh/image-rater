

export type PlayerProps = {
    position: string;
    team: string;
    select: () => any;
    unselect: () => any;
    remove: () => any;
    selected: boolean;
};
export default function Player({ position, team, selected, remove, select, unselect }: PlayerProps) {

    return (
        <div className={`flex flex-col justify-center gap-2 items-center border-2 border-black rounded-lg p-3 ${position == "UNDEFINED" || team == "UNDEFINED" ? "bg-red-600" : ""} ${selected ? "bg-yellow-400" : ""}`}>
            <div className="flex flex-col justify-center items-center gap-1">
                <p>Position: {position}</p>
                <p>Team: {team}</p>
            </div>
            <div className="flex flex-col justify-center items-center gap-1">
                <button onClick={selected ? unselect : select} className="bg-yellow-600 border border-black hover:brightness-90 active:brightness-75 py-1 px-2 rounded-md"> {selected ? "Unselect" : "Select"} </button>
                <button onClick={remove} className="bg-red-600 border border-black hover:brightness-90 active:brightness-75 py-1 px-2 rounded-md"> Delete </button>
            </div>
        </div>
    );

}