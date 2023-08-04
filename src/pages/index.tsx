import { Octokit } from "@octokit/core";
import Image from "next/image";
import { MouseEvent, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface TreePath {
  path: string;
  sha: string;
  url: string;
}

const octokit = new Octokit({
  auth: process.env.NEXT_PUBLIC_GIT_TOKEN,
});
export default function Home() {
  const [repo, setRepo] = useState("jobbler-chrome-extension");
  const [treeData, setTreeData] = useState<TreePath[]>([]);
  const [currentData, setCurrentData] = useState<TreePath>({});
  const [previewData, setPreviewData] = useState<string>("");

  const loadRepoContent = async () => {
    const res = await octokit.request(
      "GET /repos/{owner}/{repo}/branches/master",
      {
        owner: `${process.env.NEXT_PUBLIC_GIT_AUTHOR}`,
        repo: repo,
        path: "master",
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
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
        },
      }
    );
    const {
      data: { tree },
    } = response;
    const treePaths = tree as TreePath[];
    console.log("response", treePaths);
    treePaths && setTreeData([...treePaths]);
  };

  const handleSubmit = async () => {
    await loadRepoContent();
  };

  const openFile = async (tree: TreePath) => {
    const res = tree.url && (await octokit.request(`GET ${tree.url}`));
    const decodedContent = atob(res?.data?.content);
    setPreviewData(decodedContent);
    console.log("data content", res?.data?.content, decodedContent);
  };

  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-24`}
    >
      <div className="z-10 w-full max-w-5xl items-center font-mono text-sm lg:flex">
        <input
          type="text"
          placeholder="Input your repo name"
          onChange={(e) => setRepo(e.target.value)}
          className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
        <button
          onClick={handleSubmit}
          className="bg-gray-500 hover:bg-gray-300 text-white font-bold py-2 px-4 rounded ml-10"
        >
          Submit
        </button>
      </div>
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm grid grid-cols-3 gap-2">
        {!!treeData.length && (
          <div className="text-xl mt-5 col-span-3">{repo} files:</div>
        )}
        <div className="mt-2 col-start-1 self-start">
          {!!treeData.length &&
            treeData.map((tree) => (
              <div className="py-1" key={tree.sha}>
                {tree.path}
                <button
                  onClick={() => openFile(tree)}
                  className="ml-2 underline text-gray-500 hover:text-gray-400"
                >
                  preview
                </button>
              </div>
            ))}
        </div>
        {!!previewData.length && (
          <div className="col-span-2 self-start p-5 shadow-lg shadow-gray-500 md:shadow-xl overflow-hidden">
            <ReactMarkdown children={previewData} remarkPlugins={[remarkGfm]} />
          </div>
        )}
      </div>
    </main>
  );
}
