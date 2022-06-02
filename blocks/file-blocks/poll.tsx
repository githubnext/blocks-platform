import React from "react";
import { tw } from "twind";
import { FileBlockProps } from "@githubnext/blocks"; // to import tailwind css

export default function (props: FileBlockProps) {
  const { context, content, isEditable, onStoreGet, onStoreSet } = props;
  const [poll, setPoll] = React.useState(JSON.parse(content));

  React.useEffect(() => {
    Promise.all(
      poll.options.map(option => onStoreGet(`${context.path}/${option.text}`))
    ).then(values => {
      const newPoll = { ...poll };
      for (let i = 0; i < values.length; i++) {
        newPoll.options[i].votes = values[i] ?? 0;
      }
      setPoll(newPoll);
    });
  }, []);

  const onClick = (index: number) => {
    return async () => {
      poll.options[index].votes += 1;
      await onStoreSet(
        `${context.path}/${poll.options[index].text}`,
        poll.options[index].votes
      );
      setPoll({ ... poll });
    };
  };

  if (!poll || !poll.options)
    return (
      <div className={tw(`py-20 text-gray-500 w-full text-center italic`)}>
        No poll data found
      </div>
    );

  const totalVotes = poll.options.reduce((acc, cur) => acc + cur.votes, 0);

  return (
    <div className={tw(`w-full m-2 py-20 flex flex-col items-center`)}>
      {poll.poll}
      {poll.options.map((option, index) => {
        const percent = Math.floor((option.votes / totalVotes) * 100);
        return (
          <div key={index} className={tw(`my-2`)}>
            <div className={tw(`font-bold`)}>{option.text}</div>
            <div className={tw(`flex row items-center`)}>
              <div className={tw(`w-80 border border-gray-200 mr-2`)}>
                <div
                  className={tw(`bg-blue-400 h-3`)}
                  style={{ width: `${percent}%` }}
                ></div>
              </div>
              <span className={tw(`mr-2`)}>{percent}%</span>
              <span className={tw(`font-light mr-2`)}>
                {option.votes} votes
              </span>
              <button
                className={tw(
                  `bg-transparent hover:bg-blue-500 text-blue-400 hover:text-white px-2 border border-blue-500 hover:border-transparent rounded ${
                    !isEditable ? "pointer-events-none" : ""
                  }`
                )}
                onClick={onClick(index)}
              >
                Vote
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
