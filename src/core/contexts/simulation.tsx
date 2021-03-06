// @ts-ignore
import Peer from "peerjs";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  createContext,
  useContext,
} from "react";
import { Entity, SimulationState, SimulationProps } from "../types/simulation";

export const SimulationContext = createContext<SimulationState>(
  {} as SimulationState
);

export function useSimulation(): SimulationState {
  return useContext(SimulationContext);
}

/**
 * Simulation creates a P2P mesh
 * between clients by using PeerJS
 *
 * PeerJS API wraps WebRTC framework, supported by Peer Server
 * for signaling, and WebSockets for discovering new clients
 *
 * @param props
 * @constructor
 */
export const useSimulationState = (
  props = {} as SimulationProps
): SimulationState => {
  const {
    signalHost,
    signalPort,
    signalPath,
    socketServer,
    frequency = 25,
    audio = false,
  } = props;

  // Check props to enable simulation
  // TODO: Assert all SimulationProps specified
  const enabled = Object.keys(props).length > 0;

  // Manage player and network data
  const dataConnMap = useRef<Map<string, Peer.DataConnection>>();
  const simulationData = useRef<Map<string, Entity>>();

  // Setup sources
  const socket = useRef<WebSocket>();
  const mediaStream = useRef<MediaStream>();

  // Init peer state
  const [connected, setConnected] = useState(false);
  const peer = useMemo(() => {
    if (enabled) {
      return new Peer({
        host: signalHost,
        port: signalPort,
        path: signalPath,
        secure: signalPort === 443,
      });
    }
  }, [signalHost, signalPort, signalPath]);

  // Track remote player position and rotation
  const updateSimulationData = (
    dataConn: Peer.DataConnection,
    data: any
  ): void => {
    if (simulationData.current) {
      const obj = JSON.parse(data);
      if (simulationData.current.has(dataConn.peer)) {
        ["x", "y", "z"].forEach((key, idx) => {
          simulationData.current!.get(dataConn.peer)!.position[idx] =
            obj.position[idx];
          simulationData.current!.get(dataConn.peer)!.rotation[idx] =
            obj.rotation[idx];
        });
      } else {
        simulationData.current.set(dataConn.peer, {
          position: [obj.position[0], obj.position[1], obj.position[2]],
          rotation: [obj.rotation[0], obj.rotation[1], obj.rotation[2]],
        });
      }
    }
  };

  const handleMediaConn = (mediaConn: Peer.MediaConnection): void => {
    mediaConn.answer(mediaStream.current);

    mediaConn.on("stream", (stream: MediaStream) => {
      playStream(stream, mediaConn.peer);
    });

    mediaConn.on("close", () => {
      const audioElem = document.getElementById(mediaConn.peer);
      if (audioElem) audioElem.remove();
    });

    mediaConn.on("error", (err: any) => {
      console.log(err);
    });
  };

  // Handle DataConnection between peers
  const handleDataConn = (dataConn: Peer.DataConnection): void => {
    dataConn.on("open", () => {
      if (dataConnMap.current) {
        if (!dataConnMap.current.has(dataConn.peer)) {
          dataConnMap.current.set(dataConn.peer, dataConn);
        }
      }
    });

    dataConn.on("data", (data: any) => {
      updateSimulationData(dataConn, data);
    });

    dataConn.on("close", () => {
      if (dataConnMap.current) {
        if (dataConnMap.current.has(dataConn.peer)) {
          dataConnMap.current.delete(dataConn.peer);
        }
      }

      if (simulationData.current) {
        if (simulationData.current.has(dataConn.peer)) {
          simulationData.current.delete(dataConn.peer);
        }
      }
    });

    dataConn.on("error", (err: any) => {
      console.log(err);
    });
  };

  // Connect a client
  const connectPeer = (locPeer: Peer, newPeer: string): void => {
    if (locPeer.id != newPeer) {
      handleDataConn(locPeer.connect(newPeer));
    }
  };

  // Connect all clients
  const connectP2P = (locPeer: Peer): void => {
    locPeer.listAllPeers((peers: string[]) => {
      if (peers && peers.length) {
        for (const p of peers) {
          connectPeer(locPeer, p);
        }
      }
    });
  };

  // Connect client WebSocket
  const connectWS = (wss: string): void => {
    if (peer) {
      socket.current = new WebSocket(wss);

      // Emit the new ID
      socket.current.onopen = (event: Event) => {
        if (peer.id && socket.current) {
          socket.current.send(peer.id);
        }
      };

      // Catch WebSocket errors and close
      socket.current.onerror = (event: Event) => {
        if (socket.current) {
          socket.current.close();
        }
      };

      // Connect to any new peers
      socket.current.onmessage = (event: MessageEvent) => {
        connectPeer(peer, event.data);
      };
    }
  };

  // Browser permissions
  const setupAudio = (): void => {
    navigator.getUserMedia =
      navigator.getUserMedia ||
      // @ts-ignore
      navigator.webkitGetUserMedia ||
      // @ts-ignore
      navigator.mozGetUserMedia ||
      // @ts-ignore
      navigator.msGetUserMedia;

    navigator.getUserMedia(
      // Request mic
      { video: false, audio: true },
      // Success
      (audioStream: MediaStream) => {
        mediaStream.current = audioStream;
      },
      // Error
      (err: any) => {
        console.log("Voice chat requires mic access");
      }
    );
  };

  // Outgoing call
  const callPeer = (locPeer: Peer, peerId: string): void => {
    if (locPeer.id != peerId) {
      handleMediaConn(locPeer.call(peerId, mediaStream.current!));
    }
  };

  const callPeers = (locPeer: Peer): void => {
    locPeer.listAllPeers((peers: string[]) => {
      if (mediaStream.current && peers && peers.length) {
        for (const p of peers) {
          callPeer(locPeer, p);
        }
      }
    });
  };

  // Voice feed
  const playStream = (stream: MediaStream, peerId: string) => {
    const audioElem = document.createElement("audio");
    audioElem.id = peerId;
    audioElem.autoplay = true;
    audioElem.srcObject = stream;
    document.body.appendChild(audioElem);
  };

  // Send event
  const sendEvent = useCallback(
    (type: string, data: any) => {
      switch (type) {
        case "player":
          if (peer && dataConnMap.current) {
            for (const pid of dataConnMap.current.keys()) {
              if (dataConnMap.current.get(pid)!.open) {
                dataConnMap.current.get(pid)!.send(data);
              }
            }
          }
          break;
        default:
          console.log("Invalid event type");
          break;
      }
    },
    [peer]
  );

  // Get player data
  const fetch = useCallback(
    (type: string) => {
      switch (type) {
        case "entities":
          if (peer && simulationData.current) {
            return simulationData.current;
          }
          break;
        default:
          console.log("Invalid data type");
          break;
      }

      return new Map<string, Entity>();
    },
    [peer, simulationData]
  );

  // Make connections synced with props
  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (peer) {
      // Enable mic
      if (audio) setupAudio();

      peer.on("open", (id: string) => {
        if (!socketServer) return;

        dataConnMap.current = new Map<string, Peer.DataConnection>();
        simulationData.current = new Map<string, Entity>();

        // Join network of existing peers
        connectP2P(peer);

        // WebSocket listen for future peers
        connectWS(socketServer);

        // Voice chat
        if (audio) callPeers(peer);

        setConnected(true);
      });

      // P2P connection established
      peer.on("connection", (dataConn: Peer.DataConnection) => {
        handleDataConn(dataConn);
      });

      // Handle voice chat
      peer.on("call", (incoming: Peer.MediaConnection) => {
        handleMediaConn(incoming);
      });

      // Exit client
      peer.on("close", () => {
        setConnected(false);
        peer.disconnect();
        peer.destroy();
      });

      // Catch peer error
      peer.on("error", (err: Error) => {
        console.log(err);
      });
    }

    return () => {
      setConnected(false);
      if (peer) {
        peer.disconnect();
        peer.destroy();
      }
    };
  }, [peer, props]);

  return {
    connected,
    sendEvent,
    frequency,
    fetch,
  };
};
