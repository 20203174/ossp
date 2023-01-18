
const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const call = document.getElementById("call");
const room = document.getElementById("room");
const myStreamForm = document.getElementById("#myStream");
// Welcome Form (join a room)

const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");
const nameForm = document.getElementById("name");
const nameFormForm = nameForm.querySelector("form");
const msgForm = room.querySelector("form");

//login_Form
const login = document.getElementById("classRoom");
const loginBtn = document.getElementById("login");

//canvas
const canvas = document.getElementById("mainCanvas");
const ctx = canvas.getContext("2d");

const width = canvas.width;
const height = canvas.height;
//backImg
let backImg = new Image();
backImg.src = "C:\Users\kaeun\ossp\src\public\js\class.webp";
let stuImg = new Image();
stuImg.src = "https://e1.pngegg.com/pngimages/26/201/png-clipart-pucca-girl-cartoon-character-thumbnail.png";
/*stuImg.onload = function(event){
  event.preventDefault();
  ctx.drawImage(stuImg, 0, 0, 200, 250);
};*/
const tankWidth = 10;
const tankHeight = 10;
let tankX = 0;
let tankUx = 100;
const tankDx = 3;
let tankLeftPressed = false;
let tankRightPressed = false;
let tankUpPressed = false;
let tankDownPressed = false;

const draw = () => {
  ctx.clearRect(0, 0, width, height);
  if (tankLeftPressed && tankX > 0) {
    tankX -= tankDx;
  }
  if (tankRightPressed && tankX + tankWidth < width) {
    tankX += tankDx;
  }
  if (tankDownPressed && tankUx + tankHeight < height) {
    tankUx += tankDx;
  }
  if (tankUpPressed && tankUx > 0) {
    tankUx -= tankDx;
  }
  checkMissile();
  drawTank();
  drawTarget();
  drawMissile();
}

const drawTank = () => {
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(tankX, tankUx);
  /*ctx.lineTo(tankX + tankWidth, tankUx);
  ctx.lineTo(tankX + tankWidth, tankUx + tankHeight);
  ctx.lineTo(tankX, tankUx + tankHeight);
  ctx.fill();*/
  ctx.drawImage(stuImg, tankX, tankUx, 25, 40);
  ctx.stroke();
  ctx.closePath();
}
const drawTarget = () => {
  ctx.beginPath();
  ctx.arc(153.5,98,6,0,Math.PI*2);
  ctx.fillStyle="black";
  ctx.stroke();
}
const drawMissile = () => {}

const keydownHandler = event => {
  if (event.keyCode === 37) {
    tankLeftPressed = true;
  } else if (event.keyCode === 39) {
    tankRightPressed = true;
  }  else if (event.keyCode == 38){
    tankUpPressed = true;
  } else if (event.keyCode == 40){
    tankDownPressed = true;
  }
};
const keyupHandler = event => {
  if (event.keyCode === 37) {
    tankLeftPressed = false;
  } else if (event.keyCode === 39) {
    tankRightPressed = false;
  }  else if (event.keyCode == 38){
    tankUpPressed = false;
  } else if (event.keyCode == 40){
    tankDownPressed = false;
  }
};
const start = setInterval(draw, 10);
document.addEventListener("keydown", keydownHandler, false);
document.addEventListener("keyup", keyupHandler, false);

//login
call.hidden = true;
nameForm.hidden = true;
welcome.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;
let myDataChannel;

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (currentCamera.label === camera.label) {
        option.selected = true;
      }
      camerasSelect.appendChild(option);
    });
  } catch (e) {
    console.log(e);
  }
}

async function getMedia(deviceId) {
  const initialConstrains = {
    audio: true,
    video: { facingMode: "user" },
  };
  const cameraConstraints = {
    audio: true,
    video: { deviceId: { exact: deviceId } },
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstraints : initialConstrains
    );
    myFace.srcObject = myStream;
    if (!deviceId) {
      await getCameras();
    }
  } catch (e) {
    console.log(e);
  }
}

function handleMuteClick() {
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (!muted) {
    muteBtn.innerText = "Unmute";
    muted = true;
  } else {
    muteBtn.innerText = "Mute";
    muted = false;
  }
}
function handleCameraClick() {
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (cameraOff) {
    cameraBtn.innerText = "Turn Camera Off";
    cameraOff = false;
  } else {
    cameraBtn.innerText = "Turn Camera On";
    cameraOff = true;
  }
}
function handleLoginClick(event) {
  event.preventDefault();
  nameForm.hidden = false;
  welcome.hidden = false;
  login.hidden = true;
}

async function handleCameraChange() {
  await getMedia(camerasSelect.value);
  if (myPeerConnection) {
    const videoTrack = myStream.getVideoTracks()[0];
    const videoSender = myPeerConnection
      .getSenders()
      .find((sender) => sender.track.kind === "video");
    videoSender.replaceTrack(videoTrack);
  }
}

function handleMessageSubmit(event){
  event.preventDefault();
  const input = msgForm.querySelector("input");
  const msgContent = input.value;
  socket.emit("new_message", input.value, roomName, () => {
    addMessage(`You: ${msgContent}`);
  })
  input.value="";
}

function handleNicknameSubmit(event){
  event.preventDefault();
  nameFormForm.hidden=true;
  const input = nameFormForm.querySelector("input");
  const h3 = nameForm.querySelector("h3");
  h3.innerText = `${input.value} Welcome!`;
  socket.emit("nickname", input.value);
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);
loginBtn.addEventListener("click",handleLoginClick);

window.onload = function(){
nameForm.addEventListener("submit", handleNicknameSubmit);
msgForm.addEventListener("submit", handleMessageSubmit);
};
async function initCall() {
  welcome.hidden = true;
  call.hidden = false;
  nameForm.hidden = true;
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName}`;
  await getMedia();
  makeConnection();
}

async function handleWelcomeSubmit(event) {
  event.preventDefault();
  const input = welcomeForm.querySelector("input");
  roomName = input.value;
  await initCall();
  socket.emit("join_room", input.value);
  input.value = "";
}

function addMessage(message){
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  li.innerText = message;
  ul.appendChild(li);
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);
const checkMissile = () => {
  // target 명중
  if (
    tankX >= 152 &&
    tankX <= 156 &&
    tankUx >= 96 &&
    tankUx <= 100
  ) {
    if(confirm("자리에 앉았습니다. 입장하실 건가요?")){
      nameForm.hidden = false;
      welcome.hidden = false;
      login.hidden = true;
    }
  }
}

// Socket Code

socket.on("welcome", async () => {
  addMessage("someone joined!");
  myDataChannel = myPeerConnection.createDataChannel("chat");
  myDataChannel.addEventListener("message", (event) => console.log(event.data));
  console.log("made data channel");
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  console.log("sent the offer");
  socket.emit("offer", offer, roomName);
});

socket.on("offer", async (offer) => {
  myPeerConnection.addEventListener("datachannel", (event) => {
    myDataChannel = event.channel;
    myDataChannel.addEventListener("message", (event) =>
      console.log(event.data)
    );
  });
  console.log("received the offer");
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit("answer", answer, roomName);
  console.log("sent the answer");
});

socket.on("answer", (answer) => {
  console.log("received the answer");
  myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
  console.log("received candidate");
  myPeerConnection.addIceCandidate(ice);
});
socket.on("bye", () => {
  addMessage("someone left");
})
socket.on("new_message", addMessage);

// RTC Code

function makeConnection() {
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
          "stun:stun4.l.google.com:19302",
        ],
      },
    ],
  });
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("addstream", handleAddStream);
  myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data) {
  console.log("sent candidate");
  socket.emit("ice", data.candidate, roomName);
}

function handleAddStream(data) {
  const peerFace = document.getElementById("peerFace");
  peerFace.srcObject = data.stream;
}
