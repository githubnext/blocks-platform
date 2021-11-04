import { createContext, useCallback, useEffect, useRef, useState } from "react"

import { WebrtcProvider } from 'y-webrtc';
import * as Y from 'yjs';

export type UserPosition = {
  id: string,
  path: string,
  start: {
    lineNumber: number
    columnNumber: number
  },
  end: {
    lineNumber: number
    columnNumber: number
  },
}
export interface PresenceContextValue {
  positions: UserPosition[],
}

export const PresenceContext = createContext({})
export const PresenceWrapper = ({ isActive, id, children }: {
  isActive: boolean,
  id: string,
  children: React.ReactNode,
}) => {
  const [positions, setPositions] = useState<UserPosition[]>([])
  const cursorYDocMap = useRef<Y.Map<UserPosition>>()
  const cursorYDoc = useRef<Y.Doc>()

  useEffect(() => {
    setPositions([])
    // if (cursorYDocMap.current) return;
    if (!id) return;

    cursorYDoc.current = new Y.Doc();
    const docId = `devex-composable--${id}--monaco3-cursors`;
    const provider = new WebrtcProvider(docId, cursorYDoc.current)

    cursorYDocMap.current = cursorYDoc.current.getMap("cursors")
    cursorYDocMap.current.observe(() => {
      updatePositions()
    })
  }, [id])

  const updatePositions = useCallback(() => {
    const positions = cursorYDocMap.current.entries()
    const positionsArray = Array.from(positions).map(([username, position]) => ({
      id: username,
      ...position,
    }))
    setPositions(positionsArray)
  }, [])
  const setPosition = useCallback((username, position) => {
    if (!cursorYDocMap.current) return;
    cursorYDocMap.current.set(username, position)
    updatePositions()
  }, [])

  return (
    <PresenceContext.Provider value={{
      id,
      positions,
      setPosition
    }}>
      {children}
    </PresenceContext.Provider>
  )
}