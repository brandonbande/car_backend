const express = require('express');
const app = express();
const fs = require('fs');
const sharp = require('sharp'); // For image processing
const cors = require('cors');
const multer = require('multer');
const path = require('path');

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173', // Replace with your React app's origin
    credentials: true
  }));
  
  const upload = multer({
    dest: './uploads/',
    limits: {
      fieldSize: 1024 * 1024 * 5, // 5MB
    },
  });
  
  app.use(express.json({ limit: '500mb' })); // Increase limit to 50MB

  app.post('/',(req,res)=>{
    console.log('Receiving')
    res.send({
        message : req.body
    })

    console.log('Done')
  })

  app.post('/', upload.single('images'), (req, res) => {
    console.log('Receiving');
  
    // Read the uploaded file from the temporary directory
    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);
  
    // Save the uploaded image as a PNG file
    const fileName = 'image.png';
    const savePath = path.join(__dirname, 'uploads', fileName);
    fs.writeFileSync(savePath, fileBuffer);
  
    // Remove the temporary file
    fs.unlinkSync(filePath);
  
    res.send({ message: 'Image uploaded and saved successfully' });
    console.log('Done');
  });
 
app.listen(3000, () => {
 
  console.log('Server listening on port  3000');
});
