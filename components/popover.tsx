import { DismissButton, FocusScope, useOverlay } from "react-aria";
import { RefObject, useRef } from "react";

interface PopoverProps {
  popoverRef?: RefObject<HTMLDivElement>;
  children: React.ReactNode;
  isOpen?: boolean;
  onClose: () => void;
}

export function Popover(props: PopoverProps) {
  let ref = useRef<HTMLDivElement>(null);
  const { popoverRef = ref, children, isOpen, onClose } = props;

  let { overlayProps } = useOverlay(
    {
      isOpen,
      onClose,
      shouldCloseOnBlur: true,
      isDismissable: false,
    },
    popoverRef
  );

  return (
    <FocusScope restoreFocus>
      <div
        {...overlayProps}
        ref={popoverRef}
        className="absolute z-10 top-full w-full shadow-lg border border-gray-300 bg-white rounded-md mt-2"
      >
        {children}
        <DismissButton onDismiss={onClose} />
      </div>
    </FocusScope>
  );
}
