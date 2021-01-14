let connectButton;
let serialController;
let receivedValues = [];

var socket;

var mappedMouseY;
var touch = false;

function setup() {
  //node stuff
  socket = io.connect();
  socket.on('arduino', readNodeMsg);

  // canvas
  canvas = createCanvas(640, 480).parent('canvas');

  // init serial connection with baudrate
  serialController = new SerialController(57600);

  // init gui
  connectButton = createButton("Initialize Serial Connection");
  connectButton.class("button");
  connectButton.mousePressed(initSerial);
}

function draw() {
  // background
  background(0);

  sendDataToArduino();

  // instructions
  fill(255);
  text("move mouse over canvas", 32, height / 2);

  readArduinoMsg();
  sendDataToNode();
}

// init serial connection
function initSerial() {
  serialController.init();
}

function readNodeMsg(data) {
  print(data);
}

function sendDataToNode() {
  print("sending");
  data = {
    x: mappedMouseY,
    y: touch
  }
  socket.emit('arduino', data);
}

function sendDataToArduino() {
  // drive servo and LED with mouse
  mappedMouseY = int(map(mouseY, 0, width, 0, 179)); // to servo (0-179)

  // write value to serial port
  serialController.write("POSE");
  serialController.write(" "); // If sending multiple variables, they are seperated with a blank space
  serialController.write(str(mappedMouseY)); // send integer as string
  serialController.write("\r\n"); // to finish your message, send a "new line character"
}

function readArduinoMsg() {
  if (serialController.read() && serialController.hasData()) {
    print(serialController.read());
    if(serialController.read() == 1) {
      touch = true;
      background(255);
    }
    else {
      touch = false;
    }
  }
}