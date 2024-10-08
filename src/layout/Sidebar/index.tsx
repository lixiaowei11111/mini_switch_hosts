import { type Group, COMMAND, type STATUS } from "@/lib/ipc";
import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect, type FC } from "react";
import { message } from "@tauri-apps/plugin-dialog";
import Item from "./Item";

interface SidebarProps {
	onChange: (id: number) => void;
}

const Sidebar: FC<SidebarProps> = ({ onChange }) => {
	const [groups, setGroups] = useState<Group[]>([]);
	const [curId, setCurId] = useState<number>();

	useEffect(() => {
		getList();
	}, []);

	const handleSelect = (id: number) => {
		setCurId(id);
		onChange(id);
	};

	const handleSwitch = async (id: number, status: STATUS) => {
		try {
			await invoke(COMMAND.UPDATE_GROUP_STATUS, { id, status });
		} catch (error) {
			console.log("[DEBUG]", error);
			message(`switch group status failed ${error}`, "error");
		}
	};

	const getList = async () => {
		try {
			const groups: Group[] = await invoke(COMMAND.READ_CONF);
			setGroups(groups);
			setCurId(groups[0].id);
		} catch (error) {
			console.log("[DEBUG] read conf file failed", error);
			message(`read conf file failed ${error}`, "error");
		}
	};

	return (
		<div className="h-[calc(100%-54px)] w-60 overflow-auto mt-[30px]">
			{groups.map((g) => (
				<Item
					key={g.id}
					group={g}
					active={curId === g.id}
					onSwitch={handleSwitch}
					onClick={handleSelect}
				/>
			))}
		</div>
	);
};

export default Sidebar;
