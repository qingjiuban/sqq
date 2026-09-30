import { useProjectStore } from "../../store/projectStore";
import FileTree from "../explorer/FileTree";

export default function Sidebar({ embedded = false }: { embedded?: boolean }) {
  const { projectName, createFile, createFolder, refreshTree } =
    useProjectStore();

  return (
    <aside
      className={
        embedded
          ? "flex h-full w-full flex-col bg-[var(--color-panel)]"
          : "flex h-full w-64 flex-col border-r border-[var(--color-line-soft)] bg-[var(--color-panel)]"
      }
    >
      <div className="flex h-9 items-center justify-between px-3">
        <span className="panel-title truncate" title={projectName}>
          {projectName || "Explorer"}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            className="btn btn-icon"
            onClick={() => createFile(".")}
            title="New file"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 3v10M3 8h10"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            className="btn btn-icon"
            onClick={() => createFolder(".")}
            title="New folder"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 4.5A1.5 1.5 0 0 1 3.5 3h2.2l1.2 1.6h5.6A1.5 1.5 0 0 1 14 6.1v5.4A1.5 1.5 0 0 1 12.5 13h-9A1.5 1.5 0 0 1 2 11.5v-7Z"
                stroke="currentColor"
                strokeWidth="1.3"
              />
              <path
                d="M8 7.2v3.4M6.3 8.9h3.4"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            className="btn btn-icon"
            onClick={refreshTree}
            title="Refresh"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path
                d="M13 8a5 5 0 1 1-1.6-3.7M13 2.5V5h-2.5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pb-2">
        <FileTree dirPath="." depth={0} />
      </div>
    </aside>
  );
}
