const express = require('express');
const app = express();
const fs = require('fs');
const sharp = require('sharp'); // For image processing
const cors = require('cors');

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173', // Replace with your React app's origin
    credentials: true
  }));

  app.get('/',(req,res)=>{
    res.send({
        message : 'Received'
    })
  })

app.post('/upload', async (req, res) => {
  try {
    const imageData = req.body.image;
    const buffer = Buffer.from(imageData, 'base64');

    // Save the image as a PNG file
    const filename = `image-${Date.now()}.png`;
    await sharp(buffer)
      .toFormat('png')
      .toFile(`uploads/${filename}`);

    res.json({ message: 'Image uploaded successfully', filename });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error uploading image' });
  }
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
