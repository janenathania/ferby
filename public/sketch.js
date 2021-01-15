// KNN Classification on Webcam Images with poseNet

// labels (feel free to add more)
let labels = [
    "A",
    "B",
    "C"
  ];
  
  let he = 0;
  let rarm;
  let larm;
  let touch = false;

  let rup = false;
  let lup = false;

  //node
  var socket;

  //arduino connect stuff
  let connectButton;
  let serialController;
  let receivedValues = [];
  
  // webcam
  let video;
  let flippedVideo;
  let videoWidth = 160;
  let videoHeight = 120;
  
  // poseNet
  let poseNet;
  let poses = [];
  
  // Create a KNN classifier
  const knnClassifier = ml5.KNNClassifier();
  let inputData = []; // get values in 'gotResultModel'
  let predictions = [];
  let mostPredictedClass = "";
  let valueMostPredictedClass = 0.0;
  
  function preload() {
    lovbot = loadImage('assets/Lovbotneutral.png');
    lovbotup = loadImage('assets/Lovbotarmsup.png');
    lovbotleft = loadImage('assets/Lovbotleftarm.png');
    lovbotright = loadImage('assets/Lovbotrightarm.png');
    lovbotheart = loadImage('assets/Lovbotlove.png');
  }
  
  function setup() {
    //node stuff
    socket = io.connect();
    socket.on('arduino', readNodeMsg);

    // canvas
    const canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('canvas');
  
    // generate gui
    generateGui(labels);
  
    // init webcam
    video = createCapture(VIDEO);
    video.size(videoWidth, videoHeight);
    video.hide();
  
    // init poseNet Model, see https://github.com/tensorflow/tfjs-models/tree/master/posenet
    // flip horizontal und just pose of one person
    poseNet = ml5.poseNet(video, {
      flipHorizontal: true,
      detectionType: 'single'
    }, modelReady);
    //select('#output').html('... loading model');
  
    // detect if new pose detected and call 'gotResultModel'
    poseNet.on('pose', gotResultsModel);

    //arduino
    // init serial connection with baudrate
    serialController = new SerialController(57600);
   // init gui
    connectButton = createButton("Connect to lovebot");
    connectButton.class("button");
    connectButton.mousePressed(initSerial);
    connectButton.position(10,videoHeight+10);
    // initSerial();
    // serialController.init();
  }
  
  function draw() {
    // clear background
    background(255);

    push();
    translate(videoWidth, 0);
    scale(-1, 1);
    videoImg = image(video, videoWidth/2-10, videoHeight/2, videoWidth, videoHeight);
    pop();

    fill(0);
    rectMode(CENTER);

    // serialController.init();
  
    //translate(width/2, height/2);
  

  
   strokeWeight(20);
   stroke(0);
  
  
  /*
  if (he > height/2+150) {
    he = height/2+150;
  }
  if (he < height/2-240) {
    he = height/2+150;
  }
  /*/
  
  
   //line(width/2+194, height/2-62, width/2+270,he);
  
   strokeWeight(0);
  
   drawKeypoints();
   drawSkeleton();

    /*// show predictions KNN classification
    if (predictions.length > 0) {
  
      // loop through labels
      for (let i = 0; i < labels.length; i++) {
        const x = 20;
        const y = i * 24 + 20;
        noStroke();
        fill(0, 255, 0);
        textAlign(LEFT, TOP);
        textSize(16);
        text(labels[i], x, y);
        // just if there is a value
        if (predictions[i] != null) {
          text(predictions[i].toFixed(3), x + 24, y);
        }
      }
  
      // show class with highest value prediction
      textAlign(CENTER, CENTER);
      textSize(56);
      text(mostPredictedClass + ": " + valueMostPredictedClass.toFixed(3), width / 2, height / 2);
  
    }//*/

    readArduinoMsg();
    sendDataToNode();
  }

  //arduino send and read
  function sendDataToArduino(la, ra) {
    // write value to serial port
    serialController.write("POSE");
    serialController.write(" "); // If sending multiple variables, they are seperated with a blank space
    serialController.write(str(la)); // send integer as string
    serialController.write(" "); // If sending multiple variables, they are seperated with a blank space
    serialController.write(str(ra)); // send integer as string
    serialController.write("\r\n"); // to finish your message, send a "new line character"
  }
  
  function readArduinoMsg() {
    if (serialController.read() && serialController.hasData()) {
      if(serialController.read() == 1) {
        touch = true;
        console.log("touch");
      }
      else {
        touch = false;
      }
    }
  }

  function readNodeMsg(data) {
    sendDataToArduino(data.leftArmSend, data.rightArmSend);
    console.log("received!")
  }
  
  function sendDataToNode() {
    data = {
      leftArmSend: larm,
      rightArmSend: rarm,
      touchSend: touch
    }
    socket.emit('arduino', data);
  }

  function initSerial() { //initiate communication between p5 and arduino
    serialController.init();
  }
  
  // model ready
  function modelReady() {
    //select('#output').html('model loaded');
  }
  
  // results of current model (p.ex. PoseNet, handpose, facemesh...)
  function gotResultsModel(result) {
    poses = result;
    // just update input data if new input data available
    if (poses.length > 0) {
      inputData = poses[0].pose.keypoints.map(p => [p.score, p.position.x, p.position.y]);
      //console.log(inputData);
    }
  }
  
  ///////////////////////////
  // Visualization PoseNet //
  ///////////////////////////
  
  // draw ellipses over the detected keypoints
  function drawKeypoints() {
    // loop through all the poses detected
    for (let i = 0; i < poses.length; i++) {
      // for each pose detected, loop through all the keypoints
      let pose = poses[i].pose;
      for (let j = 0; j < pose.keypoints.length; j++) {
        // a keypoint is an object describing a body part (like rightArm or leftShoulder)
        let keypoint = pose.keypoints[j];
        // only draw an ellipse is the pose probability is bigger than 0.2
        if (keypoint.score > 0.2) {
          fill(0, 255, 0);
          noStroke();
          ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
        }

        let mappedHe;

        if (keypoint == pose.keypoints[10]) {
            if(pose.keypoints[10].score > 0.2) { // if the arm is visible
                fill(255,0,0);
                ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
                he = keypoint.position.y;
                mappedHe = map(he, 0, videoHeight, height/5, height-height/5);
            }

            else { // if arm not visible
                mappedHe = height-height/5;
            }
            
            strokeWeight(20);
            stroke(0);
            line(width/2+height/5, height*0.4, width/2+height/5*2, mappedHe);
            if (mappedHe < height*0.4) {
              rup = true;
            }
            else{
              rup = false;
            }
            noStroke();
            larm = map(mappedHe, height/5, height-height/5, 0, 179, true);
        }
  
        else if (keypoint == pose.keypoints[9]) {
            if(pose.keypoints[9].score > 0.2) { // if the arm is visible
                fill(255,0,0);
                ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
                he = keypoint.position.y;
                mappedHe = map(he, 0, videoHeight, height/5, height-height/5);
            }

            else { // if arm not visible
                mappedHe = height-height/5;
            }
            
            strokeWeight(20);
            stroke(0);
            line(width/2-height/5, height*0.4, width/2-height/5*2, mappedHe);
            if (mappedHe < height*0.4) {
              lup = true;
            }
            else{
              lup = false;
            }
            noStroke();
            rarm = map(mappedHe, height/5, height-height/5, 0, 179, true);
        }

       if (lup == true && rup == true) {
        imageMode(CENTER);
        image(lovbotup, width/2, height/2, windowHeight/3*2, windowHeight/3*2);
       }
       else if(rup == true){
        image(lovbotleft, width/2, height/2, windowHeight/3*2, windowHeight/3*2);
       }
       else if(lup == true){
        image(lovbotright, width/2, height/2, windowHeight/3*2, windowHeight/3*2);
       }
       else if(true){
        image(lovbotright, width/2, height/2, windowHeight/3*2, windowHeight/3*2);
       }
       else{
        imageMode(CENTER);
        image(lovbot, width/2, height/2, windowHeight/3*2, windowHeight/3*2);
       }


      }
    }
  }
  
  
  
  // draw the skeletons
  function drawSkeleton() {
    noStroke();
    // loop through all the skeletons detected
    for (let i = 0; i < poses.length; i++) {
      let skeleton = poses[i].skeleton;
      // for every skeleton, loop through all body connections
      for (let j = 0; j < skeleton.length; j++) {
        let partA = skeleton[j][0];
        let partB = skeleton[j][1];
        stroke(0, 255, 0);
        noStroke();
        line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
      }
    }
  }
  
  /////////////////////////////////////
  // KNN CLASSIFICTATION STARTS HERE //
  /////////////////////////////////////
  
  
  // Add the current input data to the classifier
  function addExample(label) {
  
    // Add an example (= input data) with a label to the classifier
    if (inputData.length > 0) {
      knnClassifier.addExample(inputData, label);
    }
  
    // update counts
    updateCounts();
  
  }
  
  // Predict the current pose.
  function classify() {
  
    // if there are no labels through error and return
    if (knnClassifier.getNumLabels() <= 0) {
      console.error('There is no examples in any label');
      return;
    }
  
    // Use knnClassifier to classify which label do these features belong to
    if (inputData.length > 0) {
      knnClassifier.classify(inputData, gotResults);
    }
  
  }
  
  
  // Show the results
  function gotResults(err, result) {
  
    // Display any error
    if (err) {
      console.error(err);
    }
  
    if (result.confidencesByLabel) {
  
      const confidences = result.confidencesByLabel; // array object
  
      // get key/label highest values and its value
      let keyHighestValue = Object.keys(confidences).reduce((a, b) => confidences[a] > confidences[b] ? a : b);
      mostPredictedClass = keyHighestValue;
      valueMostPredictedClass = confidences[keyHighestValue];
  
      // get confidence for each class
      for (let i = 0; i < labels.length; i++) {
        let confidence = confidences[labels[i]];
        predictions[i] = confidence;
      }
    }
  
    // classify again
    classify();
  
  }
  
  
  // Save dataset as myKNNDataset.json
  function saveKNN() {
    knnClassifier.save('myKNNDataset');
  }
  
  // Load dataset to the classifier
  function loadKNN() {
    knnClassifier.load('data/myKNNDataset.json', updateCounts);
  }
  
  // Update the example count for each label	
  function updateCounts() {
  
    const counts = knnClassifier.getCountByLabel();
  
    for (let i = 0; i < labels.length; i++) {
      select('#counter_' + labels[i]).html(counts[labels[i]] || 0);
    }
  }
  
  // Clear the examples in one label
  function clearLabel(classLabel) {
    if (knnClassifier.getNumLabels() <= 0) {
      console.error('There is no examples in any label');
      return;
    }
    knnClassifier.clearLabel(classLabel);
    updateCounts();
  }
  
  // Clear all the examples in all labels
  function clearAllLabels() {
    if (knnClassifier.getNumLabels() <= 0) {
      console.error('There is no examples in any label');
      return;
    }
    knnClassifier.clearAllLabels();
    updateCounts();
  }
  
  /////////////////
  // generate gui //
  //////////////////
  function generateGui(lc) {
  
    // main gui
    const gui_main = createDiv().parent('gui');
  
    // load
    const loadButton = createButton("Load Dataset").parent(gui_main);
    loadButton.class("button");
    loadButton.mousePressed(function () {
      loadKNN();
    });
  
    // save
    const saveButton = createButton("Save Dataset").parent(gui_main);
    saveButton.class("button");
    saveButton.mousePressed(function () {
      saveKNN();
    });
  
    // clear
    const clearButton = createButton("Clear Dataset").parent(gui_main);
    clearButton.class("button");
    clearButton.mousePressed(function () {
      clearAllLabels();
    });
  
    // predict
    const predictButton = createButton("Start Prediction").parent(gui_main);
    predictButton.class("button");
    predictButton.id("predict-button");
    predictButton.mousePressed(function () {
      classify();
    });
  
    // gui classes
  
    for (let i = 0; i < lc.length; i++) {
  
      // container buttons class
      const gui_class = createDiv().parent('gui');
  
      // add example button
      const add_example_button = createButton(lc[i]).parent(gui_class);
      add_example_button.html("Add an Example to Class " + lc[i]);
      add_example_button.class("button");
      add_example_button.mousePressed(function () {
        // add one example immediately
        addExample(lc[i]);
      });
  
      // clear examples button
      const clear_examples_button = createButton(lc[i]).parent(gui_class);
      clear_examples_button.html("Clear Class " + lc[i]);
      clear_examples_button.class("button");
      // add example while button pressed
      clear_examples_button.mousePressed(function () {
        clearLabel(lc[i]);
      });
  
  
      // counter examples
      const counter_examples = createSpan('0').parent(gui_class);
      counter_examples.class("text-gui");
      counter_examples.id("counter_" + lc[i]);
  
    }
  
    // debug
    const text_output = createDiv().parent('gui');
    text_output.id('output');
    text_output.html('...');
  
  }