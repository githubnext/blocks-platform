import { useState } from "react";

import { FileBlockProps, useTailwindCdn } from "@githubnext/utils";

interface PollOptions {
  text: string;
  votes: number;
}

type Poll = {
  poll: string;
  options: PollOptions[];
};

export default function (props: FileBlockProps) {
  useTailwindCdn();

  const { content } = props;
  const [poll, setPoll] = useState<Poll>(JSON.parse(content));
  if (!poll || !poll.options)
    return (
      <div className="py-20 text-gray-500 w-full text-center italic">
        No poll data found
      </div>
    );

  const totalVotes = poll.options.reduce((acc, cur) => acc + cur.votes, 0);

  return (
    <div className="w-full m-2 py-20 flex flex-col items-center">
      {poll.poll}
      {poll.options.map((option, index) => {
        const percent = Math.floor((option.votes / totalVotes) * 100);
        return (
          <div key={index} className="my-2">
            <div className="font-bold">{option.text}</div>
            <div className="flex row items-center">
              <div className="w-80 border border-gray-200 mr-2">
                <div
                  className="bg-blue-400 h-3"
                  style={{ width: `${percent}%` }}
                ></div>
              </div>
              <span className="mr-2">{percent}%</span>
              <span className="font-light mr-2">{option.votes} votes</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
