import {
  arrow,
  autoUpdate,
  flip,
  offset,
  Placement,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from "@floating-ui/react-dom-interactions";
import { cloneElement, useMemo, useRef, useState } from "react";
import { mergeRefs } from "react-merge-refs";

interface Props {
  label: string;
  placement?: Placement;
  children: React.ReactElement;
}

export const Tooltip = ({ children, label, placement = "top" }: Props) => {
  const [open, setOpen] = useState(false);
  const arrowRef = useRef<HTMLDivElement>(null);

  const { x, y, reference, floating, strategy, context, middlewareData } =
    useFloating({
      placement,
      open,
      onOpenChange: setOpen,
      strategy: "fixed",
      middleware: [offset(8), flip(), arrow({ element: arrowRef })],
      whileElementsMounted: autoUpdate,
    });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useHover(context),
    useFocus(context),
    useRole(context, { role: "tooltip" }),
    useDismiss(context),
  ]);

  // Preserve the consumer's ref
  const ref = useMemo(
    () => mergeRefs([reference, (children as any).ref]),
    [reference, children]
  );

  const staticSide = {
    top: "bottom",
    right: "left",
    bottom: "top",
    left: "right",
  }[placement.split("-")[0]];

  const { arrow: arrowData } = middlewareData;

  const arrowX = arrowData?.x;
  const arrowY = arrowData?.y;

  return (
    <>
      {cloneElement(children, getReferenceProps({ ref, ...children.props }))}
      {open && (
        <div
          {...getFloatingProps({
            ref: floating,
            className:
              "relative z-20 bg-[#24292F] text-[11px] text-white py-[0.5em] px-[0.75em] rounded-md shadow-md",
            style: {
              position: strategy,
              top: y ?? 0,
              left: x ?? 0,
            },
          })}
        >
          {label}
          <div
            className="absolute bg-[#24292F] w-[8px] h-[8px] transform rotate-45"
            style={{
              left: arrowX != null ? `${arrowX}px` : "",
              top: arrowY != null ? `${arrowY}px` : "",
              right: "",
              bottom: "",
              [staticSide]: "-4px",
            }}
            ref={arrowRef}
          />
        </div>
      )}
    </>
  );
};
