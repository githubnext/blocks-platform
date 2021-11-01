import { useEffect, useMemo, useState } from "react";
import { csvParse } from "d3"
import { Vega } from 'react-vega';
import JSONInput from 'react-json-editor-ajrm';
import { useFileContent, useUpdateFileContents } from "hooks";
import { ViewerProps } from ".";
export function ChartViewer({ contents, meta }: ViewerProps) {
  const [config, setConfig] = useState<Record<string, any>>({});

  useEffect(() => {
    try {
      const config = JSON.parse(contents);
      setConfig(config);
    } catch (e) {
      console.error(e);
    }
  }, [contents]);

  const { data: dataRes, status } = useFileContent(
    {
      repo: meta.repo,
      owner: meta.owner,
      path: config?.path,
      // fileRef: meta.sha,
    },
    {
      enabled: !!config?.path,
      refetchOnWindowFocus: false,
    }
  );

  const data = useMemo(() => {
    try {
      const parsedContent = Buffer.from(dataRes?.[0]?.content, "base64").toString();
      const parsedData = parseData(parsedContent);
      return { data: parsedData }
    } catch (e) {
      console.error(e);
      return {};
    }
  }, [dataRes]);



  console.log({ contents, config, meta, data })
  const parsedConfig = {
    width: 500,
    height: 500,
    data: [{ name: "data" }],
    ...config,
  }

  return (
    <div className="w-full h-[50em]">
      <div className="flex w-full h-full">
        <ConfigEditor config={config} setConfig={setConfig} meta={meta} />
        <div className="flex-1 font-mono">
          {!!config && !!data && (
            <Vega spec={parsedConfig} data={data} />
          )}
        </div>
      </div>
    </div>
  )
}


const ConfigEditor = ({ config, setConfig, meta }: {
  config: Record<string, any>;
  setConfig: (config: Record<string, any>) => void;
  meta: ViewerProps["meta"];
}) => {
  const [isEditing, setIsEditing] = useState(!Object.keys(config || {}).length);
  const [textConfig, setTextConfig] = useState(JSON.stringify(config, null, 2));

  useEffect(() => {
    setTextConfig(JSON.stringify(config, null, 2));
  }, [config]);

  const { mutateAsync } = useUpdateFileContents({
    onSuccess: () => {
      console.log("we did it");
    },
    onError: (e) => {
      console.log("something bad happend", e);
    },
  });

  const handleSave = async () => {
    await mutateAsync({
      content: textConfig,
      owner: meta.owner,
      repo: meta.repo,
      path: meta.name,
      sha: "latest"
    });
  };

  if (!isEditing) {
    return (
      <button className="block self-start py-2 px-3 bg-indigo-100 text-indigo-600 rounded-lg text-xs uppercase tracking-widest border  border-transparent hover:border-indigo-600 focus:border-indigo-600" onClick={() => {
        setIsEditing(true);
      }}>Edit config</button>
    )
  }

  return (
    <div className="relative flex-1 font-mono h-full text-xs max-w-[32em]">
      <JSONInput
        placeholder={config}
        height='100%'
        width='100%'
        value={textConfig}
        onChange={(newValue) => {
          setTextConfig(newValue.plainText);
          console.log(newValue.plainText)
          try {
            const config = newValue.jsObject
            setConfig(config);
          } catch (e) {
            console.error(e);
          }
        }}
      />
      {/* <textarea
        className="w-full h-full bg-gray-100 focus:outline-none p-3"
        value={textConfig}
        onChange={(e) => {
          setTextConfig(e.target.value);
          try {
            const config = JSON.parse(e.target.value);
            console.log(config)
            setConfig(config);
          } catch (e) {
            console.error(e);
          }
        }
        }
      /> */}
      <div className="absolute bottom-2 right-2 flex items-center">

        <button className="py-2 px-3 bg-yello-100 text-yello-600 rounded-lg text-xs uppercase tracking-widest border  border-transparent hover:border-yello-600 focus:border-yello-600" onClick={() => {
          try {
            const config = JSON.parse(textConfig);
            console.log(config)
            setTextConfig(JSON.stringify(config, null, 2));
          } catch (e) {
            console.error(e);
          }
        }}>Clean</button>
        <button className="py-2 px-3 bg-indigo-100 text-indigo-600 rounded-lg text-xs uppercase tracking-widest border  border-transparent hover:border-indigo-600 focus:border-indigo-600"
          onClick={handleSave}>Save config</button>
      </div>
    </div>
  )
}

const parseData = str => {
  try {
    return JSON.parse(str);
  } catch (e) {
    try {
      return csvParse(str);
    } catch (e) {
      console.error(e);
      return []
    }
  }
}