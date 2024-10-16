import type { FC } from "react";
import { useRef, useEffect, useCallback, useMemo } from "react";
// ipc
import { invoke } from "@tauri-apps/api/core";
import { COMMAND, type GroupDetail } from "@/lib/ipc";
// editor
import { EditorState, StateEffect } from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { syntaxHighlighting } from "@codemirror/language";
import { customLanguage, customHighlightStyle } from "./highlight";
import {
	defaultKeymap,
	insertNewline,
	historyKeymap,
	history,
} from "@codemirror/commands";

import { useToast } from "@/hooks/use-toast";
import { useDebounceFn } from "ahooks";

interface EditorProps {
	uuid: string;
	onChange?: (doc: string) => void;
}

// https://codemirror.net/docs/ref/#commands.insertNewlineAndIndent
const customKeymap = keymap.of([
	{ key: "Enter", run: insertNewline },
	...defaultKeymap,
	...historyKeymap,
]);

const Editor: FC<EditorProps> = ({ uuid }) => {
	const editorRef = useRef<HTMLDivElement>(null);
	const viewRef = useRef<EditorView | null>(null);

	const { toast } = useToast();

	const getGroupDetailById = useCallback(async (uuid: string) => {
		try {
			const groupDetail: GroupDetail = await invoke(COMMAND.READ_GROUP, {
				uuid,
			});
			console.log("[DEBUG] read group detail success", groupDetail);
			const transaction = viewRef.current?.state.update({
				changes: {
					from: 0,
					insert: groupDetail.content,
				},
				effects: StateEffect.appendConfig.of(EditorView.editable.of(!uuid)),
			});
			transaction && viewRef.current?.dispatch(transaction);
			console.log(
				"[debug] dispatch after",
				viewRef.current?.state.toJSON().doc,
			);
		} catch (error) {
			console.log("[DEBUG] read group detail failed", error);
		}
	}, []);

	const handleUpdateGroup = async () => {
		try {
			const content = viewRef.current?.state.toJSON().doc;
			await invoke(COMMAND.UPDATE_GROUP_CONTENT, { uuid, content });
			toast({
				description: "save success",
				variant: "success",
			});
		} catch (error) {
			console.log("[debug] error", error);
			toast({
				description: "save failed",
				variant: "destructive",
			});
		}
	};

	const { run: debounceUpdateGroup } = useDebounceFn(handleUpdateGroup, {
		wait: 300,
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	const saveKeymap = useMemo(() => {
		return keymap.of([
			{
				key: "Mod-s",
				run: () => {
					debounceUpdateGroup();
					return true;
				},
			},
		]);
	}, []);

	useEffect(() => {
		const customTheme = EditorView.theme({
			"&": {
				color: "#fff",
				"font-weight": 600,
			},
			".cm-content": {
				"caret-color": "#fff",
			},
			"&.cm-focused": {
				outline: "none",
			},
			".cm-gutters": {
				"background-color": "transparent",
				"border-right": "none",
				color: "#ddd",
			},
		});
		const startState = EditorState.create({
			doc: "",
			extensions: [
				customKeymap,
				saveKeymap,
				lineNumbers(),
				history(),
				customTheme,
				customLanguage,
				syntaxHighlighting(customHighlightStyle),
			],
		});

		const view = new EditorView({
			state: startState,
			parent: editorRef?.current || undefined,
		});

		viewRef.current = view;

		return () => {
			view.destroy();
		};
	}, [saveKeymap]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		getGroupDetailById(uuid);
	}, [uuid]);

	return <div ref={editorRef} />;
};

export default Editor;
