const Seedr = require('../seedr');
const seedr = new Seedr();

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    try {
        const { magnetLink } = JSON.parse(event.body);
        const username = process.env.SEEDR_USERNAME;
        const password = process.env.SEEDR_PASSWORD;

        await seedr.login(username, password);
        const response = await seedr.addMagnet(magnetLink);

        return {
            statusCode: 200,
            body: JSON.stringify(response),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
