require('dotenv').config();
const express = require('express');
const app = express();
const port = 3000;
const Seedr = require('./seedr');
const seedr = new Seedr();

const username = process.env.SEEDR_USERNAME;
const password = process.env.SEEDR_PASSWORD;

// Serve static files from the public directory
app.use(express.static('public'));

// Login to Seedr once when the server starts
seedr.login(username, password).then(() => {
  console.log('Logged in to Seedr successfully.');
}).catch(error => {
  console.error('Seedr login error:', error);
});

// Endpoint to get video URL by ID
app.get('/video/:id', async (req, res) => {
  const videoId = req.params.id;
  try {
    // Fetch video details from Seedr
    const videoContents = await seedr.getVideos();
    
    // Find the video with the specified ID
    let videoUrl = null;
    let videoName = null;

    for (const videoArray of videoContents) {
        for (const vide of videoArray) {
            if (vide && vide.id && vide.name && vide.id.toString() === videoId) {
                try {
                    const downloadLink = await seedr.getFile(vide.id); // Fetch the download link
                    videoUrl = downloadLink.url;
                    videoName = vide.name;
                    break; // Exit loop once the video is found
                } catch (error) {
                    console.error(`Failed to fetch download link for video ID ${vide.id}:`, error);
                }
            }
        }
        if (videoUrl) break; // Exit outer loop if video is found
    }
    
    // Output the video URL or null if not found
    if (videoUrl) {
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Video Player</title>
        </head>
        <body>
          <h1>Video Player</h1>
          <p>${videoName}</p>
          <video id="videoPlayer" controls width="600">
            <source src="${videoUrl}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        </body>
        </html>
      `);
    } else {
      res.status(404).send('Video not found');
    }
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).send('Internal server error');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
