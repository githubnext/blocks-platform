import { Button, SelectMenu } from "@primer/components";
import { viewers } from "./viewers";

interface ViewerPickerProps {
  value: string;
  extension: string;
  onChange: (newType: string) => void;
}

export default function ViewerPicker(props: ViewerPickerProps) {
  const { value, extension, onChange } = props;
  const relevantViewers = viewers.filter(viewer => (
    viewer.extensions.includes(extension) || viewer.extensions.includes("*")
  ))

  return (
    <SelectMenu>
      <Button as="summary">Viewer: {value}</Button>
      <SelectMenu.Modal>
        <SelectMenu.Header>Viewers</SelectMenu.Header>
        <SelectMenu.List>
          {relevantViewers.map((d) => {
            return (
              <SelectMenu.Item
                as="button"
                key={d.id}
                onClick={(e) => {
                  onChange(d.id);
                }}
              >
                {d.label}
              </SelectMenu.Item>
            );
          })}
        </SelectMenu.List>
      </SelectMenu.Modal>
    </SelectMenu>
  );
}
