const { MongoClient } = require('mongodb');
exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }
    let client;
    try {
        const { url } = JSON.parse(event.body);
        const {id} =JSON.parse(event.body);
        if (!url) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'URL is required' }),
            };
        }
        const apiKey = process.env.LULU_STREAM_API;
        const luluStreamApiUrl = `https://lulustream.com/api/upload/url?key=${apiKey}&url=${encodeURIComponent(url)}`;

        const uploadResponse = await fetch(luluStreamApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!uploadResponse.ok) {
            throw new Error(`Lulustream API request failed with status ${uploadResponse.status}`);
        }

        const uploadData = await uploadResponse.json();
        const { filecode } = uploadData.result;
        if (!filecode) {
            throw new Error('File code not found in upload response');
        }
        // MongoDB Atlas connection
        const uri = process.env.MONGODB_URI; // Your MongoDB connection string
        client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

        await client.connect();

        const database = client.db('msrajmoviesdldb'); // Replace with your database name
        const collection = database.collection('msrajmoviesdlcol'); // Replace with your collection name
        const timestamp = new Date(); // Current timestamp
        // Update the document if it exists, or insert a new one if it doesn't
        const insertResult = await collection.updateOne(
        { id: id }, // Match the id
        { 
          $set: {
            filecode: filecode,
            createdAt: timestamp, // Set the timestamp here
          }
        },
        { upsert: true } // Insert if no document matches the id
      );
        return {
            statusCode: 200,
            body: JSON.stringify({insertResult:insertResult,filecode: filecode}),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: error.message }),
        };
    } finally {
        if (client) {
            await client.close();
        }
    }
};