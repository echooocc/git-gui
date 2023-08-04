// Next.js API route support: https://nextjs.org/docs/apiroutes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
const { Octokit } = require("@octokit/core");

type Data = {
  name: string
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  res.status(200).json({ name: 'John Doe' })
}

