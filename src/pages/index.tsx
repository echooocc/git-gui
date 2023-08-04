import { Octokit } from "@octokit/core";
import Image from "next/image";
import { useEffect, useState } from "react";

const octokit = new Octokit({
  auth: process.env.NEXT_PUBLIC_GIT_TOKEN,
});
export default function Home() {
  const [repo, setRepo] = useState("jobbler-chrome-extension");

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

    console.log("response", response);
  };

  const handleSubmit = async () => {
    await loadRepoContent();
  };

  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-24`}
    >
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <input
          type="text"
          placeholder="Input your repo name"
          onChange={(e) => setRepo(e.target.value)}
        />
        <button onClick={handleSubmit}>Submit</button>
      </div>
    </main>
  );
}
