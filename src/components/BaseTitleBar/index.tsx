import Icon from "@/components/Icon";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { message } from "@tauri-apps/plugin-dialog";
import { useMemo, useState } from "react";
import { css } from "@emotion/react";
import type {
	FC,
	MouseEvent,
	MouseEventHandler,
	PropsWithChildren,
} from "react";

const titlebarStyle = css`
	height: 30px;
  background: #fff;
  user-select: none;
  display: flex;
  justify-content: flex-end;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
`;

const titlebarButtonStyle = css`
 	display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 30px;
  height: 30px;
  user-select: none;
  -webkit-user-select: none;
	color: #222;
	&:hover {
  	background: #eee;
	}
`;

const closeButtonSeyle = css([
	titlebarButtonStyle,
	{ "&:hover": { background: "#dc2626" } },
]);

const BaseTitleBar: FC<PropsWithChildren> = ({ children }) => {
	const [isMaximized, setIsMaximized] = useState<boolean>(false);

	const appWindow = useMemo(() => {
		return getCurrentWindow();
	}, []);

	const handleMinimize = async (e: MouseEvent<HTMLDivElement>) => {
		e.stopPropagation();
		try {
			await appWindow.minimize();
		} catch (error) {
			console.log("[DEBUG] 最小化窗口发生错误", error);
			await message("[DEBUG] 最小化窗口发生错误", {
				title: "DEBUG",
				kind: "error",
			});
		}
	};
	const handleToggleMaximize: MouseEventHandler<HTMLDivElement> = async (e) => {
		e.stopPropagation();
		try {
			await appWindow.toggleMaximize();
			const isMaximized = await appWindow.isMaximized();
			setIsMaximized(isMaximized);
		} catch (error) {
			console.log("[DEBUG] 切换最大化窗口发生错误", error);
			await message("[DEBUG] 切换最大化窗口发生错误", {
				title: "DEBUG",
				kind: "error",
			});
		}
	};
	const handleClose: MouseEventHandler<HTMLElement> = async (e) => {
		e.stopPropagation();
		try {
			await appWindow.close();
		} catch (error) {
			console.log("[DEBUG] 关闭窗口发生错误", error);
			await message("[DEBUG] 关闭窗口发生错误", {
				title: "DEBUG",
				kind: "error",
			});
		}
	};

	const handleMouseDown: MouseEventHandler<HTMLDivElement> = (e) => {
		if (e.buttons === 1 && e.detail !== 2 && e.target === e.currentTarget) {
			appWindow.startDragging();
		}
	};

	return (
		<div css={titlebarStyle} onMouseDown={handleMouseDown}>
			{children}
			<Icon
				css={titlebarButtonStyle}
				type="window-minimize"
				onClick={handleMinimize}
			/>
			<Icon
				css={titlebarButtonStyle}
				className="text-[14px]"
				type={isMaximized ? "window-restore" : "window-maximize"}
				onClick={handleToggleMaximize}
			/>
			<Icon css={closeButtonSeyle} type="window-close" onClick={handleClose} />
		</div>
	);
};

export default BaseTitleBar;