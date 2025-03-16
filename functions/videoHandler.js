const { MongoClient } = require('mongodb');
const Seedr = require('../seedr');
const seedr = new Seedr();
const mongoUri = process.env.MONGODB_URI; // MongoDB connection string

const username = process.env.SEEDR_USERNAME;
const password = process.env.SEEDR_PASSWORD;

exports.handler = async (event) => {
  const videoId = event.queryStringParameters.id; // Get video ID from query parameters

  try {
// MongoDB Atlas connection
client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
await client.connect();
const database = client.db('msrajmoviesdldb'); // Replace with your database name
const collection = database.collection('msrajmoviesdlcol'); // Replace with your collection name

 // Fetch the latest filecode from MongoDB using the videoId and sort by timestamp
 const videoId1 = Number(event.queryStringParameters.id); // If id is stored as a number
 
 let videoRecord;
 let filecode;
 try {
   videoRecord = await collection.findOne(
     { id: videoId1 },
     { sort: { createdAt: -1 } }
   );
 } catch (err) {
   console.error("Error fetching video record:", err);
   return {
     statusCode: 500,
     body: JSON.stringify({ error: 'Internal Server Error - Failed to Fetch Video Record' }),
   };
 }

 if (!videoRecord || !videoRecord.filecode) {
  filecode='';
 }
 else{
  filecode = videoRecord.filecode;
 }



//const filecode = videoRecord.filecode;

let player_img;
const apiKey = process.env.LULU_STREAM_API;
const luluStreamApiUrl = `https://lulustream.com/api/file/info?key=${apiKey}&file_code=${filecode}`;

const uploadResponse = await fetch(luluStreamApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
});

if (!uploadResponse.ok) {
    throw new Error(`Lulustream API request failed with status ${uploadResponse.status}`);
}

const uploadData = await uploadResponse.json();
if (uploadData.status === 400) {
  player_img = '';
  // Handle the error case
} else if (Array.isArray(uploadData.result) && uploadData.result.length > 0) {
  // Handle the success case
   player_img = uploadData.result[0].player_img;
} else {
  // Handle unexpected cases
}

    await seedr.login(username, password);
    const videoContents = await seedr.getVideos();

    let videoUrl = null;
    let videoName = null;
    for (const videoArray of videoContents) {
      for (const vide of videoArray) {
        if (vide && vide.id && vide.id.toString() === videoId) {
          try {
            const downloadLink = await seedr.getFile(vide.id);
            videoUrl = downloadLink.url;
            videoName = vide.name;
            break;
          } catch (error) {
            console.error(`Failed to fetch download link for movie ID ${vide.id}:`, error);
          }
        }
      }
      if (videoUrl) break;
    }

    if (videoUrl) {
      return {
        statusCode: 200,
        body: JSON.stringify({ videoUrl,videoName,filecode,player_img }),
        headers: { 'Content-Type': 'application/json' },
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Movie Not Found' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }
  } catch (error) {
    console.error('Error fetching movie:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
      headers: { 'Content-Type': 'application/json' },
    };
  } finally {
    if (client) {
      await client.close();
    }
  }
};