import { Octokit } from "@octokit/core";
import Image from "next/image";
import { Fragment, MouseEvent, useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface GitFileData {
  path: string;
  sha: string;
  url: string;
}
interface FileData {
  file: GitFileData;
  content: string;
}

const octokit = new Octokit({
  auth: process.env.NEXT_PUBLIC_GIT_TOKEN,
});
export default function Home() {
  const [repo, setRepo] = useState("dailycoding");
  const [filesData, setFilesData] = useState<GitFileData[]>([]);
  const [currentFileData, setCurrentFileData] = useState<FileData>({
    content: "",
    file: {
      path: "",
      sha: "",
      url: "",
    },
  });

  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);

  const onClickEdit = () => {
    setEditing(true);
  };

  useEffect(() => {
    if (editing) {
      setError(null);
    }
  }, [editing]);

  const loadRepoContent = async () => {
    try {
      const res = await octokit.request(
        "GET /repos/{owner}/{repo}/branches/master",
        {
          owner: `${process.env.NEXT_PUBLIC_GIT_AUTHOR}`,
          repo: repo,
          path: "master",
          headers: {
            "X-GitHub-Api-Version": "2022-11-28",
            "If-None-Match": "",
          },
        }
      );
      const {
        data: {
          commit: {
            commit: {
              tree: { sha: treeSha },
            },
          },
        },
      } = res;
      const response = await octokit.request(
        "GET /repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=true",
        {
          owner: `${process.env.NEXT_PUBLIC_GIT_AUTHOR}`,
          repo: repo,
          tree_sha: treeSha,
          headers: {
            "X-GitHub-Api-Version": "2022-11-28",
            "If-None-Match": "",
          },
        }
      );
      const {
        data: { tree },
      } = response;
      const trees = tree as GitFileData[];
      trees && setFilesData([...trees]);
    } catch (err) {
      setError(err.message);
    }
  };

  const onHandleRepoChange = (e) => {
    error && setError(null);
    filesData && setFilesData([]);
    setRepo(e.target.value);
  };

  const onHandleSubmit = async () => {
    await loadRepoContent();
  };

  const onPreviewFile = async (file: GitFileData) => {
    setError(null);
    setEditing(false);

    const res = file.url && (await octokit.request(`GET ${file.url}`));
    const decodedContent = atob(res?.data?.content);
    setCurrentFileData({ content: decodedContent, file: file });
  };

  const onClickSave = async () => {
    try {
      setEditing(false);
      const encodeContent = btoa(currentFileData.content);
      const res = await octokit.request(
        "PUT /repos/{owner}/{repo}/contents/{path}",
        {
          owner: `${process.env.NEXT_PUBLIC_GIT_AUTHOR}`,
          repo: repo,
          path: currentFileData.file.path,
          message: "update file",
          committer: {
            name: "demo",
            email: "test@github.com",
          },
          sha: currentFileData.file.sha,
          content: encodeContent,
          headers: {
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }
      );
      const {
        data: {
          content: { path, url, sha },
        },
      } = res;
      setCurrentFileData({
        content: currentFileData.content,
        file: { path, url, sha },
      });
      loadRepoContent();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Fragment>
      {error && (
        <div
          className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 absolute w-full"
          role="alert"
        >
          <p className="font-bold">Try Again</p>
          <p>{error}</p>
        </div>
      )}
      <main className={`flex min-h-screen flex-col p-24`}>
        <div className="z-10 w-full max-w-5xl items-center font-mono text-sm lg:flex">
          <input
            type="text"
            placeholder="Input your repo name"
            onChange={onHandleRepoChange}
            className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          <button
            onClick={onHandleSubmit}
            className="bg-gray-500 hover:bg-gray-300 text-white font-bold py-2 px-4 rounded ml-10"
          >
            Submit
          </button>
        </div>
        <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm grid grid-cols-3 gap-2">
          {!!filesData.length && (
            <div className="text-xl mt-5 col-span-3">{repo} files:</div>
          )}
          <div className="mt-2 col-start-1 self-start">
            {!!filesData.length &&
              filesData.map((file) => (
                <div className="py-1" key={file.sha}>
                  {file.path}
                  <button
                    onClick={() => onPreviewFile(file)}
                    className="ml-2 underline text-gray-500 hover:text-gray-400"
                  >
                    preview
                  </button>
                </div>
              ))}
          </div>
          <div className="col-span-2 self-start">
            {!!currentFileData.content && (
              <div className="flex flex-col">
                {!editing ? (
                  <button
                    className="block ml-2 underline text-gray-500 hover:text-gray-400 mb-5"
                    onClick={onClickEdit}
                  >
                    Edit
                  </button>
                ) : (
                  <button
                    className="block ml-2 underline text-gray-500 hover:text-gray-400 mb-5"
                    onClick={onClickSave}
                  >
                    Save
                  </button>
                )}
                {!editing ? (
                  <div className="p-5 shadow-lg shadow-gray-500 md:shadow-xl overflow-hidden">
                    <ReactMarkdown
                      children={currentFileData.content}
                      remarkPlugins={[remarkGfm]}
                    />
                  </div>
                ) : (
                  <textarea
                    value={currentFileData.content}
                    onChange={(e) =>
                      setCurrentFileData({
                        content: e.target.value,
                        file: currentFileData.file,
                      })
                    }
                    rows="20"
                    className="block p-5 shadow-lg shadow-gray-500 md:shadow-xl overflow-hidden min-h-full"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </Fragment>
  );
}
