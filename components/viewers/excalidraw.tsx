import { Button } from "@primer/components";
import { useUpdateFileContents } from "hooks";
import { useState, useEffect, useRef, useCallback } from "react";
import { serializeAsJSON } from "@excalidraw/excalidraw";
import { ViewerProps } from ".";

import {
  AzureClient,
  AzureContainerServices,
} from "@fluidframework/azure-client";
import { IFluidContainer, ISharedMap, SharedMap } from "fluid-framework";
import { connectionConfig, containerSchema, getContainerId } from "lib/azure";
import { useDeepCompareEffect, useShallowCompareEffect } from "react-use";

const allowList = ["excalidraw"];

interface ExcalidrawModel {
  getMutationState(): string;
  getDrawingState(): string;
  setMutationState(state: string): void;
  setDrawingState(state: string): void;
  setChangeListener(listener: () => void): void;
  removeChangeListener(listener: () => void): void;
}

const c_DrawingStatePrefix = "c_drawingState";
const c_MutationStatePrefix = "c_mutationStateEx123";

function createModel(fluid: IFluidContainer): ExcalidrawModel {
  // Global sharedMap that stores attributes of all the notes.
  // The sharedMap can be updated by any user connected to the session
  const sharedMap: ISharedMap = fluid.initialObjects.map as SharedMap;

  return {
    getDrawingState() {
      return sharedMap.get(c_DrawingStatePrefix);
    },
    getMutationState() {
      return sharedMap.get(c_MutationStatePrefix);
    },
    setMutationState(state: string) {
      console.log("inside setMutationState");
      sharedMap.set(c_MutationStatePrefix, state);
    },
    setDrawingState(state: string) {
      sharedMap.set(c_DrawingStatePrefix, state);
    },
    // Attach a listener on the sharedMap to listen for any value change
    setChangeListener(listener: () => void): void {
      sharedMap.on("valueChanged", listener);
    },

    // Remove listen on the sharedMap
    removeChangeListener(listener: () => void): void {
      sharedMap.off("valueChanged", listener);
    },
  };
}

export const ExcalidrawViewer: React.FC<ViewerProps> = (props) => {
  const [container, setContainer] = useState<IFluidContainer>();
  const [services, setServices] = useState<AzureContainerServices>();

  useEffect(() => {
    async function handler() {
      const { containerId, isNew } = getContainerId();
      const client = new AzureClient(connectionConfig);

      let container: IFluidContainer;
      let services: AzureContainerServices;

      if (isNew) {
        ({ container, services } = await client.createContainer(
          containerSchema
        ));
        const containerId = await container.attach();
        location.hash = containerId;
      } else {
        ({ container, services } = await client.getContainer(
          containerId,
          containerSchema
        ));
      }

      setContainer(container);
      setServices(services);

      if (!container.connected) {
        await new Promise<void>((resolve) => {
          container.once("connected", () => {
            resolve();
          });
        });
      }
    }

    handler();
  }, []);

  if (!services || !container) {
    return <div>Loading...</div>;
  }

  return (
    <ExcalidrawCanvas {...props} services={services} container={container} />
  );
};

const ExcalidrawCanvas: React.FC<
  ViewerProps & { services: AzureContainerServices; container: IFluidContainer }
> = (props) => {
  const { contents, meta, services, container } = props;
  const extension = meta.name.split(".").pop();
  const [model] = useState<ExcalidrawModel>(createModel(container));

  const [appState, setAppState] = useState(null);
  const [elements, setElements] = useState([]);

  const [fluidState, setFluidState] = useState<any>({
    mutationState: "",
  });

  const [Comp, setComp] = useState(null);

  const audience = services.audience;

  const [members, setMembers] = useState(
    Array.from(audience.getMembers().values())
  );
  const authorInfo = audience.getMyself();

  const setMembersCallback = useCallback(() => {
    setMembers(Array.from(audience.getMembers().values()));
  }, [setMembers, audience]);

  useEffect(() => {
    container.on("connected", setMembersCallback);
    audience.on("membersChanged", setMembersCallback);
    return () => {
      container.off("connected", () => setMembersCallback);
      audience.off("membersChanged", () => setMembersCallback);
    };
  }, [container, audience, setMembersCallback]);

  useEffect(() => {
    import("@excalidraw/excalidraw").then((comp) => setComp(comp.default));
  }, []);

  useEffect(() => {
    const syncLocalAndFluidState = () => {
      console.log("syncing local and fluid state");
      const parsed = JSON.parse(model.getDrawingState());
      setFluidState({
        mutationState: model.getMutationState(),
        elements: parsed.elements,
        appState: parsed.appState,
      });
    };

    // Add a listener on the BrainstormModel listener
    // The listener will call syncLocalAndFluidState everytime there a "valueChanged" event.
    model.setChangeListener(syncLocalAndFluidState);

    return () => {
      model.removeChangeListener(syncLocalAndFluidState);
    };
  }, []);

  const handleChange = (elements: any, appState: any) => {
    setElements(elements);
    setAppState(appState);
  };

  const { mutateAsync, status } = useUpdateFileContents();

  const handleSave = async () => {
    const serialized = serializeAsJSON(elements, appState);
    model.setDrawingState(serialized);

    await mutateAsync({
      content: serialized,
      owner: meta.owner,
      repo: meta.repo,
      path: meta.name,
      sha: meta.sha,
    });
  };

  useEffect(() => {
    model.setMutationState(status);
  }, [status]);

  if (!allowList.includes(extension)) {
    return (
      <div className="p-8 text-gray-500 text-sm">
        We can't display that file, sorry.
      </div>
    );
  }

  if (authorInfo === undefined) {
    return <div>Loading author info </div>;
  }

  const isDisabled =
    status === "loading" || fluidState.mutationState === "loading";

  return (
    <div className="h-full flex flex-col">
      <div>
        {status} vs. {model.getMutationState()}
      </div>
      <div className="flex-shrink-0">
        <Button disabled={isDisabled} onClick={handleSave}>
          {isDisabled ? "Saving..." : "Save Changes"}
        </Button>
      </div>
      <div className="flex-1">
        {Comp && (
          <Comp
            initialData={{
              elements: fluidState.elements,
              appState: fluidState.appState,
            }}
            onChange={handleChange}
          />
        )}
      </div>
    </div>
  );
};
