import { Button, ButtonPrimary, Link } from '@primer/components';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { Diff, Hunk, parseDiff } from 'react-diff-view';
import "react-diff-view/style/index.css";
import { diffAsText } from "unidiff";

export const UpdateCodeModal = ({
  path,
  newCode,
  currentCode = "",
  isLoggedIn = false,
  onSubmit,
  onClose,
}: {
  path: string;
  newCode: string;
  currentCode?: string;
  isLoggedIn: boolean;
  onSubmit: (metadata: any) => void;
  onClose: () => void;
}) => {
  const diff = diffAsText(currentCode, newCode);
  const files = parseDiff(diff);
  const isMetadata = path.startsWith(".github/blocks/")

  return (
    <div className="fixed inset-0">

      <AlertDialog.Root
        open={true}
        onOpenChange={isOpen => {
          console.log({ isOpen })
          if (!isOpen) onClose();
        }}
      >
        <AlertDialog.Overlay
          className="z-[90] bg-black opacity-90 fixed inset-0 cursor-pointer"
          onClick={() => {
            onClose();
          }}
        />
        <AlertDialog.Content
          className="z-[90] bg-white p-10 rounded-3xl max-h-[90vh] overflow-y-auto"
          style={{
            maxWidth: "min(70em, 90vw)",
            transform: `translate(-50%, -50%) translate(50vw, 50vh)`,
          }}
        >
          {isLoggedIn ? (
            <>
              <AlertDialog.Title className="text-3xl font-bold">
                Let's make that change!
              </AlertDialog.Title>

              <AlertDialog.Description className="py-5">
                <p className="pb-4 text-lg">
                  {isMetadata ? <>
                    We store Block metadata in the <pre className="inline bg-gray-100 py-1 p-2 rounded-md">.github/blocks/</pre> folder. To update it, we'll create a commit for that metadata file.
                  </> : <>
                    We'll create a commit to update the <pre className="inline bg-gray-100 py-1 p-2 rounded-md">{path}</pre> file.
                  </>}
                </p>
                <div className="overflow-y-auto" style={{
                  maxHeight: "calc(100vh - 27em)",
                  minHeight: "20em"
                }}>
                  {files.map(({ oldRevision, newRevision, type, hunks }) => (
                    <Diff key={oldRevision + '-' + newRevision} viewType="split" diffType={type} hunks={hunks}>
                      {hunks => hunks.map(hunk => <Hunk key={hunk.content} hunk={hunk} />)}
                    </Diff>
                  ))}
                </div>
              </AlertDialog.Description>

              <div className="space-x-3 flex justify-end">
                <AlertDialog.Cancel
                  onClick={() => {
                    onClose();
                  }}>
                  <Button fontSize="2">
                    Cancel
                  </Button>
                </AlertDialog.Cancel>
                <AlertDialog.Action onClick={async () => {
                  await onSubmit(newCode);
                  onClose();
                }}>
                  <ButtonPrimary fontSize="2">
                    Commit changes
                  </ButtonPrimary>
                </AlertDialog.Action>
              </div>
            </>
          ) : (
            <>
              <AlertDialog.Title className="text-3xl font-bold">
                Authentication required
              </AlertDialog.Title>

              <AlertDialog.Description className="py-5">
                <p className="pb-4 text-lg">
                  Hop over to <Link href="/">the homepage</Link> to sign in before you make any changes to this repo.
                </p>
              </AlertDialog.Description>

              <div className="space-x-3 flex justify-end">
                <AlertDialog.Cancel
                  onClick={() => {
                    onClose();
                  }}>
                  <Button fontSize="2">
                    Cancel
                  </Button>
                </AlertDialog.Cancel>
              </div>
            </>
          )}
        </AlertDialog.Content>
      </AlertDialog.Root>
    </div >
  )
}