const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const Twit = require('twit');
const Sentiment = require('sentiment');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const T = new Twit({
    consumer_key: 'rUO78xhGNNHJC2QpI4C0wOIGz',
    consumer_secret: 'KScfVdvGPkJ3JtM6AJG7ep8RLZ2dp3PEXnonClYZVBD0lZSnk6',
    access_token: '1791034196154261504-c68XW2dqQWWifVNH0QAWoXbmfUcQZZ',
    access_token_secret: 'lBJrG5ppdNMhxefMjory8fSvuLr4ahym7TPr10JnXHcmV',
});

const sentiment = new Sentiment();

io.on('connection', (socket) => {
    console.log('New client connected');

    let stream;

    socket.on('track', (keyword) => {
        console.log(`Tracking keyword: ${keyword}`);

        if (stream) {
            stream.stop();
        }

        stream = T.stream('statuses/filter', { track: keyword });

        stream.on('tweet', (tweet) => {
            console.log('Received tweet:', tweet);
            const result = sentiment.analyze(tweet.text);
            const sentimentScore = result.score > 0 ? 'positive' : result.score < 0 ? 'negative' : 'neutral';

            socket.emit('tweet', {
                text: tweet.text,
                sentiment: sentimentScore,
                user: tweet.user.screen_name,
            });
        });

        stream.on('error', (error) => {
            console.error('Twitter stream error:', error);
            socket.emit('error', 'An error occurred while streaming tweets');
        });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
        if (stream) {
            stream.stop();
        }
    });
});

const port = 3000; 
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
