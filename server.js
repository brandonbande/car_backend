const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require("cors");
const fs = require('fs');
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const apiKey = 'AIzaSyBKDAnzRKaj_4UItgrCAeYfw-KkmGyUNrg';
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);
const path = require('path');
//Model 1 is for detail extraction only
const model1 = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: "Given an image of a car , return a json object with car details in the form . return the output format given below only\n{\n      colour : 'colour' ,\n      type : 'family or sports or public' ,\n      features : 'notable features'\n\n}",
});
//Model  classifies whether there is a car or not
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: "Given an image, determine if there is a car or not.If a car is there , return 1 and if it is not there return 0. Your output should only be 0 or 1.",
});
const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

async function detailExtractionAgent(file) {
  const files = [
    await uploadToGemini(file, "image/jpeg")
  ];

  const chatSession = model1.startChat({
    generationConfig,
    history: [
      {
        role: "user",
        parts: [
          {
            fileData: {
              mimeType: files[0].mimeType,
              fileUri: files[0].uri,
            },
          },
        ],
      }
    ],
  });

  const result = await chatSession.sendMessage("Return the response in the given output format");
  console.log(result.response.text());
}

async function classifyingAgent(file) {
  const files = [
    await uploadToGemini(file, "image/jpeg")
  ];

  const chatSession = model.startChat({
    generationConfig,
    history: [
      {
        role: "user",
        parts: [
          {
            fileData: {
              mimeType: files[0].mimeType,
              fileUri: files[0].uri,
            },
          },
        ],
      }
    ],
  });

  const result = await chatSession.sendMessage("Return 0 if there is no car in focus and return 1 if there is a car.");
  const hasCar = result.response.text();
  try {
    const carNumber = parseInt(hasCar);
    return isNaN(carNumber) ? hasCar : carNumber;
  } catch (error) {
    // If the parsing fails, try to get the text from the response object
    return hasCar || result.response.text();
  }
}
async function uploadToGemini(path, mimeType) {
  const uploadResult = await fileManager.uploadFile(path, {
    mimeType,
    displayName: path,
  });
  const file = uploadResult.file;
  console.log(`Uploaded file ${file.displayName} as: ${file.name}`);
  return file;
}
// Set maximum payload size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(bodyParser.json());
app.use(cors());


app.get('/',(req,res)=>{
  res.send({
    cameras : [
      {
        camera : 2,
        imageLinks : '/camera2_030120251100.jpg',
        isOnline : false
      },
      {
        camera : 3,
        imageLinks : '/camera3_030120251100.jpg',
        isOnline : true
      }
    ] ,
    invoices : [
      {
        car : 'Black Family',
        parkStatus : true,
        accruedCosts : 500,
        lastSeen : ''
      },
      {
        car : 'Yellow Bus',
        parkStatus : false,
        accruedCosts : 20.50,
        lastSeen : '11-11-2025'
      },
      {
        car : 'Green Sports Car',
        parkStatus : true,
        accruedCosts : 9000,
        lastSeen : ''
      },
      {
        car : 'Black Family',
        parkStatus : true,
        accruedCosts : 500,
        lastSeen : ''
      },
      {
        car : 'Black Comapct Jeep',
        parkStatus : false,
        accruedCosts : 500,
        lastSeen : ''
      },
      {
        car : 'Black and Green Family',
        parkStatus : true,
        accruedCosts : 500,
        lastSeen : ''
      }

    ]
  })
})

app.post('/upload', (req, res) => {
// Create the images directory if it doesn't exist
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
}
  const image = req.body.image;
  const imageName = `Camera_1_${Date.now()}.jpg`;
  const imagePath = `/Users/Rogue Coder/Desktop/car_backend/uploads/${imageName}`; //
  const imageBuffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  //write to file
  fs.writeFile(imagePath, imageBuffer, async (err) => {
    if (err) {
      console.error('Error saving image:', err);
      res.status(500).send('Error saving image');
      return
    } else {
      console.log('Image saved:', imageName);
      //Introducing agent 1
      const hasCar = await classifyingAgent(imagePath)
      hasCar === 0 ? res.send({
        response : 'No car Detected'
      }) : res.send({
        message : classifyingAgent(imagePath)
      })

      console.log(hasCar)
      console.log(classifyingAgent(imagePath))
    }
  });
});

app.listen(8080, () => {
  console.log('Server is running on port 8080');
});