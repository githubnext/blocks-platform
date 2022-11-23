import { Box, Dialog, Text } from "@primer/react";

export const WarningModal = ({
  title,
  message,
  onClose = () => {},
}: {
  title: string;
  message: React.ReactNode;
  onClose?: () => void;
}) => {
  return (
    <div className="relative z-50">
      <Dialog
        isOpen={true}
        onDismiss={() => {
          onClose();
        }}
        aria-labelledby="label"
      >
        <Dialog.Header>{title}</Dialog.Header>
        <Box p={3}>
          <Text>{message}</Text>
        </Box>
      </Dialog>
    </div>
  );
};
