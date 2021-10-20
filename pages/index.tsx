import { Button } from "@primer/components";
import { SquirrelIcon } from "@primer/octicons-react";

export default function Home() {
  return (
    <div className="flex items-center justify-center bg-gray-50 h-screen">
      <div className="flex flex-col space-y-4">
        <SquirrelIcon size={56} className="text-gray-400 mx-auto" />
        <Button>Ship it</Button>
      </div>
    </div>
  );
}
