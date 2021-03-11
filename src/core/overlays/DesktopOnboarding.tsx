import styled from "@emotion/styled";
import { isMobile } from "react-device-detect";
import { useEnvironment } from "../contexts/environment";
import { keyframes } from "@emotion/core";

const Container = styled.div<{ paused: boolean }>`
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 100;
  transition: opacity 0.25s ease;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  opacity: ${(props) => (props.paused ? 1 : 0)};
  pointer-events: ${(props) => (props.paused ? "all" : "none")};
`;

const ClickContainer = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: -1;
`;

const hueRotate = keyframes`
  from{
    filter: hue-rotate(0deg);
  }
  to {
    filter: hue-rotate(360deg);
  }
`;

const Window = styled.div`
  width: 90%;
  max-width: 400px;
  height: 91vw;
  max-height: 400px;
  padding: 20px 20px;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  position: relative;
  border-radius: 3%;
  background-image: url("https://d27rt3a60hh1lx.cloudfront.net/images/muse-bg.jpg");
  background-position: center;
  background-size: cover;
  font-family: sans-serif;
  animation: ${hueRotate} 15s ease infinite;
  box-sizing: border-box;
`;

const Continue = styled.div`
  width: 90%;
  max-width: 400px;
  height: auto;
  cursor: pointer;
  text-align: center;
  font-size: 1.3em;
  font-family: "Quicksand", sans-serif;
  transition: opacity 0.15s linear;
  margin-top: 20px;
  background: white;
  line-height: 1em;
  padding: 12px 0;
  border-radius: 10px;
  :hover {
    opacity: 0.5;
  }
`;

const Version = styled.a`
  position: absolute;
  top: 24px;
  right: 60px;
  font-size: 0.6em;
`;

const Instagram = styled.div`
  position: absolute;
  top: 24px;
  left: 60px;
  width: auto;
  height: auto;
  color: white;
  cursor: pointer;
  transition: opacity 0.15s linear;
  font-size: 0.6em;
  line-height: 1em;
  :hover {
    opacity: 0.5;
  }
`;

const Header = styled.div`
  margin-top: 15%;
  width: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: "Quicksand", sans-serif;
`;

const Title = styled.div`
  font-size: 2em;
  text-align: center;
  margin-bottom: 0em;
  line-height: 1em;
`;

const Text = styled.div`
  width: 100%;
  height: auto;
  margin: 10px 0;
  font-family: "Roboto", sans-serif, monospace;
  font-size: 0.7em;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  & > p {
    margin: 0.2em;
  }
`;

const InfoPics = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  @media screen and (max-width: 400px) {
    margin-top: -20px;
  }
`;

const Keys = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 50%;
`;

const Key = styled.div`
  width: 50px;
  height: 50px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  border-radius: 5px;
  box-shadow: 5px 5px rgba(0, 0, 0, 0.5);
  border: 2px solid white;
  margin-bottom: 7px;
  @media screen and (max-width: 400px) {
    width: 30px;
    height: 30px;
  }
`;

const Captions = styled.div`
  width: 67%;
  margin-top: -20px;
  margin-left: 25px;
  font-size: 0.6em;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  @media screen and (max-width: 400px) {
    width: 75%;
    margin-left: 30px;
  }
`;

const BottomKeys = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  width: 100%;
`;

const DesktopOnboarding = () => {
  const { paused, overlay, setPaused, firstVisit, setVisit } = useEnvironment();
  const closeOverlay = () => {
    setPaused(false);
    setVisit(false);
  };

  if (overlay) {
    return null;
  }

  return firstVisit ? (
    <Container paused={paused}>
      <ClickContainer onClick={closeOverlay} />
      <Window>
        <Version>v1.3.1</Version>
        <Instagram
          onClick={() => window.open("https://www.instagram.com/musehq")}
        >
          @musehq
        </Instagram>
        <Header>
          <Title>Muse</Title>
        </Header>
        <Text>
          <p>Pause with the {isMobile ? "Menu Button" : "Esc key"}</p>
        </Text>
        {isMobile ? (
          <InfoPics>
            <img
              src="https://d27rt3a60hh1lx.cloudfront.net/images/joystick.gif"
              width={100}
              style={{
                mixBlendMode: "multiply",
                position: "relative",
                left: "35px",
                bottom: "25px",
              }}
            />
            <img
              src="https://d27rt3a60hh1lx.cloudfront.net/images/gesture.gif"
              width={120}
            />
          </InfoPics>
        ) : (
          <InfoPics>
            <Keys>
              <Key>W</Key>
              <BottomKeys>
                <Key>A</Key>
                <Key>S</Key>
                <Key>D</Key>
              </BottomKeys>
            </Keys>
            <img
              src="https://d27rt3a60hh1lx.cloudfront.net/images/source.gif"
              width={175}
            />
          </InfoPics>
        )}
        <Captions>
          <p>Move</p>
          <p>Look Around</p>
        </Captions>
      </Window>
      <Continue onClick={closeOverlay}>continue</Continue>
    </Container>
  ) : (
    <></>
  );
};

export default DesktopOnboarding;