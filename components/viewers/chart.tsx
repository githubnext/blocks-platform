import { useEffect, useMemo, useState } from "react";
import { csvParse } from "d3";
import { Vega } from "react-vega";
import JSONInput from "react-json-editor-ajrm";
import { ViewerProps } from ".";
export function ChartViewer({ contents, meta, metadata, onUpdateMetadata }: ViewerProps) {
  const [config, setConfig] = useState<Record<string, any>>({});

  const data = useMemo(() => ({ data: parseData(contents) }), [contents]);

  const parsedConfig = {
    width: 500,
    height: 500,
    data: [{ name: "data" }],
    ...config,
  };

  return (
    <div className="w-full h-full">
      <div className="flex w-full h-full">
        <ConfigEditor config={config} setConfig={setConfig} metadata={metadata} onUpdateMetadata={onUpdateMetadata} />
        <div className="flex-1 font-mono p-8 px-10">
          {!!config && !!data && <Vega spec={parsedConfig} data={data} />}
        </div>
      </div>
    </div>
  );
}

const ConfigEditor = ({
  config,
  setConfig,
  metadata,
  onUpdateMetadata,
}: {
  config: Record<string, any>;
  setConfig: (config: Record<string, any>) => void;
  metadata: Record<string, any>;
  onUpdateMetadata: (metadata: Record<string, any>) => void;
}) => {
  const configs = metadata?.configs || []
  const [activeConfigIndex, setActiveConfigIndex] = useState(0);

  const [isEditing, setIsEditing] = useState(!Object.keys(config || {}).length);
  const [textConfig, setTextConfig] = useState(JSON.stringify(config, null, 2));

  useEffect(() => {
    const config = configs[activeConfigIndex]
    setConfig(config || {});
  }, [activeConfigIndex, metadata]);

  useEffect(() => {
    setTextConfig(JSON.stringify(config, null, 2));
  }, [config]);

  const handleSave = async () => {
    const updatedConfigs = {
      ...metadata,
      configs: [
        ...configs.slice(0, activeConfigIndex),
        JSON.parse(textConfig),
        ...configs.slice(activeConfigIndex + 1),
      ]
    }
    onUpdateMetadata(updatedConfigs)
  };

  if (!isEditing) {
    return (
      <button
        className="block self-start py-2 px-3 bg-indigo-100 text-indigo-600 rounded-lg text-xs uppercase tracking-widest border  border-transparent hover:border-indigo-600 focus:border-indigo-600"
        onClick={() => {
          setIsEditing(true);
        }}
      >
        Edit config
      </button>
    );
  }

  return (
    <div className="relative flex-1 flex flex-col font-mono h-full text-xs max-w-[32em]">
      <div className="flex-none flex items-center p-2 py-2">
        <select className="p-2 py-2" value={activeConfigIndex} onChange={(e) => setActiveConfigIndex(Number(e.target.value))}>
          {configs.map((config, index) => (
            <option key={index} value={index}>
              Chart #{index + 1}
            </option>
          ))}
          <option value={configs.length}>
            New chart
          </option>
        </select>
        <div className="ml-auto flex items-center space-x-2">
          <button
            className="py-2 px-3 bg-yello-100 text-yello-600 rounded-lg text-xs uppercase tracking-widest border  border-transparent hover:border-yello-600 focus:border-yello-600"
            onClick={() => {
              const newMetadata = [
                ...configs.slice(0, activeConfigIndex),
                ...configs.slice(activeConfigIndex + 1),
              ]
              onUpdateMetadata({
                ...metadata,
                configs: newMetadata
              })
            }}
          >
            delete
          </button>
          <button
            className="py-2 px-3 bg-yellow-100 text-yellow-600 rounded-lg text-xs uppercase tracking-widest border  border-transparent hover:border-yellow-600 focus:border-yellow-600"
            onClick={() => {
              try {
                const config = JSON.parse(textConfig);
                setTextConfig(JSON.stringify(config, null, 2));
              } catch (e) {
                console.error(e);
              }
            }}
          >
            Clean
          </button>
          <button
            className="py-2 px-3 bg-indigo-100 text-indigo-600 rounded-lg text-xs uppercase tracking-widest border  border-transparent hover:border-indigo-600 focus:border-indigo-600"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <JSONInput
          placeholder={config}
          height="100%"
          width="100%"
          value={textConfig}
          onChange={(newValue) => {
            setTextConfig(newValue.plainText);
            try {
              const config = newValue.jsObject;
              setConfig(config);
            } catch (e) {
              console.error(e);
            }
          }}
        />
      </div>
    </div>
  );
};

const parseData = (str) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    try {
      return csvParse(str);
    } catch (e) {
      console.error(e);
      return [];
    }
  }
};
