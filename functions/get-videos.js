const Seedr = require('../seedr');
const seedr = new Seedr();

exports.handler = async function(event, context) {
    try {
        const username = process.env.SEEDR_USERNAME;
        const password = process.env.SEEDR_PASSWORD;
        
        await seedr.login(username, password);

        const videoContents = await seedr.getVideos();
        const videoLinks = [];

        for (const videoArray of videoContents) {
            for (const video of videoArray) {
                if (video && video.id && video.name) {
                    const downloadLink = await seedr.getFile(video.id);
                    videoLinks.push({ name: video.name, id: video.id, fid: video.fid, url: downloadLink.url });
                }
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify(videoLinks),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
