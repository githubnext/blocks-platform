import { Button } from "@primer/react";
import { CommitCodeDialog } from "components/commit-code-dialog";
import { useSession } from "next-auth/react";
import { useState } from "react";

const oldCode = `export const degreesToRadians = (degrees: number) => (degrees * Math.PI) / 180;
export const radiansToDegrees = (radians: number) => (radians * 180) / Math.PI;

interface PtOnCircleParams {
  radius: number;
  offset?: number;
  angle: number;
}

export const pointOnCircle = (params: PtOnCircleParams) => {
  const { radius, offset = 0, angle } = params;

  return {
    x: offset + radius * Math.cos(degreesToRadians(angle)),
    y: offset + radius * Math.sin(degreesToRadians(angle)),
  };
};
`;

const newCode = `export const degreesToRadians = (degrees: number) => (degrees * Math.PI) / 180;
export const radiansToDegrees = (radians: number) => (radians * 180) / Math.PI;

interface PtOnCircleParams {
  radius: number;
  offset?: number;
  angle: number;
}

export const pointOnCircle = (params: PtOnCircleParams) => {
  const { radius, offset = 0, angle = 0 } = params;

  return {
    x: offset + radius * Math.cos(degreesToRadians(angle)),
    y: offset + radius * Math.sin(degreesToRadians(angle)),
  };
};
`;

export default function Test() {
  const { data, status } = useSession({
    required: true,
  });

  const [isOpen, setIsOpen] = useState(false);
  const handleClose = () => {
    setIsOpen(false);
  };

  if (status === "loading") return <p>Loading...</p>;

  return (
    <div className="p-4">
      <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
      <CommitCodeDialog
        path="src/lib.ts"
        newCode={newCode}
        currentCode={oldCode}
        isOpen={isOpen}
        onClose={handleClose}
        token={data.token as string}
        sha="0094a25d619210007e4599123fb7de5318c51c45"
        repo="tusi"
        owner="mattrothenberg"
      />
    </div>
  );
}
